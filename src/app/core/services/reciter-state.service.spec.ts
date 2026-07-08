import { TestBed } from '@angular/core/testing';
import { ReciterStateService, RECITERS, Reciter } from './reciter-state.service';

describe('ReciterStateService', () => {
  let service: ReciterStateService;

  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
      clear: vi.fn(() => { for (const k in store) delete store[k]; }),
      get length() { return Object.keys(store).length; },
      key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    });
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReciterStateService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('default state', () => {
    it('should default to Alafasy when no stored reciter exists', () => {
      expect(service.selectedReciter().id).toBe('alafasy');
      expect(service.selectedName()).toBe('Mishary Rashid Alafasy');
    });

    it('should expose the full list of curated reciters', () => {
      expect(service.reciters.length).toBe(RECITERS.length);
      expect(service.reciters.length).toBeGreaterThanOrEqual(10);
    });

    it('should have sidebar closed initially', () => {
      expect(service.sidebarOpen()).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should restore a previously selected reciter from localStorage', () => {
      const sudais = RECITERS.find(r => r.id === 'sudais')!;
      localStorage.setItem('quran_reciter', JSON.stringify(sudais));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(ReciterStateService);
      expect(newService.selectedReciter().id).toBe('sudais');
    });

    it('should fall back to default when stored JSON is corrupted', () => {
      localStorage.setItem('quran_reciter', 'NOT_VALID_JSON');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(ReciterStateService);
      expect(newService.selectedReciter().id).toBe('alafasy');
    });

    it('should fall back to default when stored reciter ID is unknown', () => {
      localStorage.setItem('quran_reciter', JSON.stringify({ id: 'unknown-reciter' }));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const newService = TestBed.inject(ReciterStateService);
      expect(newService.selectedReciter().id).toBe('alafasy');
    });
  });

  describe('selectReciter()', () => {
    it('should update the selected reciter', () => {
      const husary = RECITERS.find(r => r.id === 'husary')!;
      service.selectReciter(husary);

      expect(service.selectedReciter()).toBe(husary);
      expect(service.selectedName()).toBe('Mahmoud Khalil Al-Husary');
      expect(service.selectedFolder()).toBe('Husary_128kbps');
    });

    it('should persist the selection to localStorage', () => {
      const maher = RECITERS.find(r => r.id === 'maher')!;
      service.selectReciter(maher);

      const stored = JSON.parse(localStorage.getItem('quran_reciter')!);
      expect(stored.id).toBe('maher');
    });

    it('should close the sidebar after selecting a reciter', () => {
      service.toggleSidebar();
      expect(service.sidebarOpen()).toBe(true);

      service.selectReciter(RECITERS[2]);
      expect(service.sidebarOpen()).toBe(false);
    });
  });

  describe('sidebar', () => {
    it('toggleSidebar() should open and close alternately', () => {
      service.toggleSidebar();
      expect(service.sidebarOpen()).toBe(true);

      service.toggleSidebar();
      expect(service.sidebarOpen()).toBe(false);
    });

    it('closeSidebar() should close the sidebar', () => {
      service.toggleSidebar();
      service.closeSidebar();
      expect(service.sidebarOpen()).toBe(false);
    });
  });

  describe('getAyahAudioUrl()', () => {
    it('should generate a properly padded EveryAyah CDN URL', () => {
      const url = service.getAyahAudioUrl(1, 1);
      expect(url).toBe('https://everyayah.com/data/Alafasy_128kbps/001001.mp3');
    });

    it('should pad surah and ayah numbers to 3 digits', () => {
      const url = service.getAyahAudioUrl(2, 286);
      expect(url).toBe('https://everyayah.com/data/Alafasy_128kbps/002286.mp3');
    });

    it('should use the currently selected reciter folder', () => {
      const sudais = RECITERS.find(r => r.id === 'sudais')!;
      service.selectReciter(sudais);

      const url = service.getAyahAudioUrl(114, 6);
      expect(url).toBe(`https://everyayah.com/data/${sudais.folder}/114006.mp3`);
    });
  });
});
