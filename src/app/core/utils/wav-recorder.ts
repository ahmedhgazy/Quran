export class WavRecorder {
  private audioCtx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private recording = false;
  private leftChannel: number[] = [];
  private originalSampleRate = 44100;

  constructor() {}

  async start(): Promise<void> {
    if (this.recording) return;

    this.leftChannel = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    
    // Create AudioContext at hardware native rate to ensure no browser-specific downsampling errors
    this.audioCtx = new AudioContextClass();
    this.originalSampleRate = this.audioCtx.sampleRate;

    // VERY IMPORTANT: Browser policies suspend AudioContext until user interaction. Resume explicitly to start processing.
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    
    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      // Copy samples chunk-by-chunk to the array
      for (let i = 0; i < inputData.length; i++) {
        this.leftChannel.push(inputData[i]);
      }
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioCtx.destination);
    this.recording = true;
    console.log('WavRecorder started recording at native hardware sample rate:', this.originalSampleRate);
  }

  async stop(): Promise<Blob> {
    if (!this.recording) {
      throw new Error('Not recording');
    }

    this.recording = false;

    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
    }
    if (this.source) {
      this.source.disconnect();
    }
    if (this.audioCtx) {
      await this.audioCtx.close();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    const rawSamples = new Float32Array(this.leftChannel);
    console.log('WavRecorder stopped. Total raw samples captured:', rawSamples.length);

    if (rawSamples.length === 0) {
      console.warn('WavRecorder warning: Captured 0 audio samples! Check microphone permissions or hardware input.');
    } else {
      // Audio gain normalization: amplify quiet recordings so Whisper can hear clearly
      let maxVal = 0;
      for (let i = 0; i < rawSamples.length; i++) {
        const val = Math.abs(rawSamples[i]);
        if (val > maxVal) maxVal = val;
      }
      console.log('Recorded peak audio amplitude:', maxVal);
      if (maxVal > 0 && maxVal < 0.8) {
        const ratio = 0.85 / maxVal;
        for (let i = 0; i < rawSamples.length; i++) {
          rawSamples[i] *= ratio;
        }
        console.log('Normalizing audio volume by factor:', ratio);
      }
    }

    // Downsample the native browser samples to 16,000Hz which is required by Whisper
    const resampled = this.downsampleBuffer(rawSamples, this.originalSampleRate, 16000);
    console.log('Resampled samples count to 16kHz:', resampled.length);

    const wavBlob = this.encodeWAV(resampled, 16000);
    return wavBlob;
  }

  isRecording(): boolean {
    return this.recording;
  }

  private downsampleBuffer(buffer: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
    if (inputSampleRate === outputSampleRate) {
      return buffer;
    }
    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    
    let offsetResult = 0;
    let offsetBuffer = 0;
    
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  private encodeWAV(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    this.floatTo16BitPCM(view, 44, samples);

    return new Blob([view], { type: 'audio/wav' });
  }

  private floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
