import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not be loading initially', () => {
    expect(service.isLoading()).toBe(false);
  });

  it('should be loading after start() is called', () => {
    service.start();
    expect(service.isLoading()).toBe(true);
  });

  it('should not be loading after start() then stop()', () => {
    service.start();
    service.stop();
    expect(service.isLoading()).toBe(false);
  });

  it('should track multiple concurrent requests', () => {
    service.start();
    service.start();
    service.start();

    service.stop();
    expect(service.isLoading()).toBe(true);

    service.stop();
    expect(service.isLoading()).toBe(true);

    service.stop();
    expect(service.isLoading()).toBe(false);
  });

  it('should never go below zero active requests', () => {
    service.stop();
    service.stop();
    service.stop();

    expect(service.isLoading()).toBe(false);

    service.start();
    expect(service.isLoading()).toBe(true);
  });
});
