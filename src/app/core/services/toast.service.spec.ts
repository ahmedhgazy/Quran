import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService, Toast } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);

    let counter = 0;
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => `mock-uuid-${++counter}` as `${string}-${string}-${string}-${string}-${string}`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created with no toasts', () => {
    expect(service).toBeTruthy();
    expect(service.toasts()).toHaveLength(0);
  });

  describe('convenience methods', () => {
    it('success() should create a success toast with default title', () => {
      service.success('Operation completed');

      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].title).toBe('Success');
      expect(toasts[0].message).toBe('Operation completed');
    });

    it('error() should create an error toast with default title', () => {
      service.error('Something went wrong');

      const toast = service.toasts()[0];
      expect(toast.type).toBe('error');
      expect(toast.title).toBe('Error');
    });

    it('warning() should create a warning toast with default title', () => {
      service.warning('Be careful');

      const toast = service.toasts()[0];
      expect(toast.type).toBe('warning');
      expect(toast.title).toBe('Warning');
    });

    it('info() should create an info toast with default title', () => {
      service.info('Just letting you know');

      const toast = service.toasts()[0];
      expect(toast.type).toBe('info');
      expect(toast.title).toBe('Info');
    });

    it('should allow a custom title override', () => {
      service.success('Done!', 'Custom Title');
      expect(service.toasts()[0].title).toBe('Custom Title');
    });
  });

  describe('show()', () => {
    it('should return a unique ID for each toast', () => {
      const id1 = service.show('success', 'T', 'M1');
      const id2 = service.show('success', 'T', 'M2');

      expect(id1).not.toBe(id2);
    });

    it('should use default duration for each toast type', () => {
      service.show('success', 'T', 'M');
      expect(service.toasts()[0].duration).toBe(5000);

      service.show('error', 'T', 'M');
      const errorToast = service.toasts().find(t => t.type === 'error');
      expect(errorToast?.duration).toBe(7000);
    });

    it('should allow a custom duration', () => {
      service.show('info', 'T', 'M', 2000);
      expect(service.toasts()[0].duration).toBe(2000);
    });

    it('should record createdAt timestamp', () => {
      const before = Date.now();
      service.show('info', 'T', 'M');
      const after = Date.now();

      const toast = service.toasts()[0];
      expect(toast.createdAt).toBeGreaterThanOrEqual(before);
      expect(toast.createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe('auto-dismiss', () => {
    it('should auto-dismiss a toast after its duration elapses', fakeAsync(() => {
      service.show('success', 'T', 'Auto-dismiss test', 1000);
      expect(service.toasts()).toHaveLength(1);

      tick(999);
      expect(service.toasts()).toHaveLength(1);

      tick(1);
      expect(service.toasts()).toHaveLength(0);
    }));

    it('should not auto-dismiss when duration is 0', fakeAsync(() => {
      service.show('info', 'T', 'Persistent toast', 0);
      tick(10000);
      expect(service.toasts()).toHaveLength(1);
    }));
  });

  describe('dismiss()', () => {
    it('should remove a specific toast by ID', () => {
      const id = service.show('success', 'T', 'Will be dismissed', 0);
      expect(service.toasts()).toHaveLength(1);

      service.dismiss(id);
      expect(service.toasts()).toHaveLength(0);
    });

    it('should be a no-op for a non-existent ID', () => {
      service.show('info', 'T', 'M', 0);
      service.dismiss('non-existent-id');
      expect(service.toasts()).toHaveLength(1);
    });
  });

  describe('max toasts cap', () => {
    it('should evict the oldest toast when exceeding the limit of 5', () => {
      for (let i = 1; i <= 6; i++) {
        service.show('info', 'T', `Toast ${i}`, 0);
      }

      const toasts = service.toasts();
      expect(toasts).toHaveLength(5);
      expect(toasts[0].message).toBe('Toast 2');
      expect(toasts[4].message).toBe('Toast 6');
    });
  });
});
