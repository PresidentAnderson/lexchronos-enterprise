// Performance utilities for mobile optimization

export class PerformanceMonitor {
  private metrics: { [key: string]: number } = {};
  private observers: { [key: string]: PerformanceObserver } = {};

  // Start timing a operation
  startTiming(name: string): void {
    this.metrics[`${name}_start`] = performance.now();
  }

  // End timing and log the result
  endTiming(name: string): number {
    const startTime = this.metrics[`${name}_start`];
    if (!startTime) {
      console.warn(`No start time found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics[name] = duration;
    
    if (duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  // Monitor Core Web Vitals
  initCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const lcpEntry = entries[entries.length - 1];
      const lcp = lcpEntry.startTime;
      console.log('LCP:', lcp);
      
      if (lcp > 2500) {
        console.warn('Poor LCP:', lcp);
      } else if (lcp > 4000) {
        console.error('Very poor LCP:', lcp);
      }
    });

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      const fidEntry = entries[0];
      const fid = fidEntry.processingStart - fidEntry.startTime;
      console.log('FID:', fid);
      
      if (fid > 100) {
        console.warn('Poor FID:', fid);
      } else if (fid > 300) {
        console.error('Very poor FID:', fid);
      }
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observePerformanceEntry('layout-shift', (entries) => {
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      console.log('CLS:', clsValue);
      
      if (clsValue > 0.1) {
        console.warn('Poor CLS:', clsValue);
      } else if (clsValue > 0.25) {
        console.error('Very poor CLS:', clsValue);
      }
    });
  }

  private observePerformanceEntry(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes: [type] });
      this.observers[type] = observer;
    } catch (error) {
      console.error(`Failed to observe ${type}:`, error);
    }
  }

  // Get memory usage (Chrome only)
  getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  // Log performance metrics
  logMetrics(): void {
    console.table(this.metrics);
    
    const memoryInfo = this.getMemoryUsage();
    if (memoryInfo) {
      console.log('Memory usage:', {
        used: `${(memoryInfo.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memoryInfo.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memoryInfo.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      });
    }
  }

  // Cleanup observers
  cleanup(): void {
    Object.values(this.observers).forEach(observer => {
      observer.disconnect();
    });
    this.observers = {};
  }
}

// Image optimization utilities
export class ImageOptimizer {
  // Compress image to target size
  static async compressImage(file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Generate optimized srcSet for responsive images
  static generateSrcSet(baseUrl: string, sizes: number[]): string {
    return sizes
      .map(size => `${baseUrl}?w=${size} ${size}w`)
      .join(', ');
  }

  // Create WebP version if supported
  static supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
}

// Network optimization
export class NetworkOptimizer {
  private static connectionInfo: any = null;

  // Get network information
  static getConnectionInfo(): any {
    if ('connection' in navigator) {
      this.connectionInfo = (navigator as any).connection;
      return this.connectionInfo;
    }
    return null;
  }

  // Check if connection is slow
  static isSlowConnection(): boolean {
    const connection = this.getConnectionInfo();
    if (!connection) return false;

    return (
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      connection.saveData === true
    );
  }

  // Get recommended image quality based on connection
  static getRecommendedImageQuality(): number {
    if (this.isSlowConnection()) return 0.6;
    
    const connection = this.getConnectionInfo();
    if (connection?.effectiveType === '3g') return 0.7;
    
    return 0.85;
  }

  // Preload critical resources
  static preloadResource(url: string, type: 'script' | 'style' | 'image' | 'fetch'): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    
    if (type === 'image') {
      link.setAttribute('imagesrcset', url);
    }
    
    document.head.appendChild(link);
  }

  // Prefetch resources for next page
  static prefetchResource(url: string): void {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }
}

// Battery optimization
export class BatteryOptimizer {
  private static batteryInfo: any = null;

  // Get battery information
  static async getBatteryInfo(): Promise<any> {
    if ('getBattery' in navigator) {
      try {
        this.batteryInfo = await (navigator as any).getBattery();
        return this.batteryInfo;
      } catch (error) {
        console.error('Battery API not available:', error);
      }
    }
    return null;
  }

  // Check if device is in power-saving mode
  static async isPowerSaveMode(): Promise<boolean> {
    const battery = await this.getBatteryInfo();
    if (!battery) return false;

    return battery.level < 0.2 || !battery.charging;
  }

  // Get recommended refresh rate based on battery
  static async getRecommendedRefreshRate(): Promise<number> {
    const isPowerSave = await this.isPowerSaveMode();
    return isPowerSave ? 30 : 60; // fps
  }

  // Reduce animations if low battery
  static async shouldReduceAnimations(): Promise<boolean> {
    const isPowerSave = await this.isPowerSaveMode();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    return isPowerSave || prefersReducedMotion;
  }
}

// Virtual scrolling for large lists
export class VirtualScroller {
  private container: HTMLElement;
  private items: any[];
  private itemHeight: number;
  private visibleCount: number;
  private scrollTop: number = 0;
  private startIndex: number = 0;
  private endIndex: number = 0;
  private renderCallback: (items: any[], startIndex: number) => void;

  constructor(
    container: HTMLElement,
    items: any[],
    itemHeight: number,
    renderCallback: (items: any[], startIndex: number) => void
  ) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.renderCallback = renderCallback;
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2; // Buffer

    this.init();
  }

  private init(): void {
    this.container.style.height = `${this.items.length * this.itemHeight}px`;
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
    this.updateVisibleItems();
  }

  private handleScroll(): void {
    this.scrollTop = this.container.scrollTop;
    this.updateVisibleItems();
  }

  private updateVisibleItems(): void {
    this.startIndex = Math.floor(this.scrollTop / this.itemHeight);
    this.endIndex = Math.min(this.startIndex + this.visibleCount, this.items.length);
    
    const visibleItems = this.items.slice(this.startIndex, this.endIndex);
    this.renderCallback(visibleItems, this.startIndex);
  }

  public updateItems(newItems: any[]): void {
    this.items = newItems;
    this.container.style.height = `${this.items.length * this.itemHeight}px`;
    this.updateVisibleItems();
  }

  public scrollToIndex(index: number): void {
    const scrollTop = index * this.itemHeight;
    this.container.scrollTop = scrollTop;
  }

  public destroy(): void {
    this.container.removeEventListener('scroll', this.handleScroll);
  }
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize performance monitoring in browser
if (typeof window !== 'undefined') {
  performanceMonitor.initCoreWebVitals();
}