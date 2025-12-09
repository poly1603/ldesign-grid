/**
 * 性能优化工具
 */

/** 节流函数 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
): T & { cancel: () => void } {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);

    lastArgs = args;

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        if (lastArgs) {
          fn.apply(this, lastArgs);
        }
      }, remaining);
    }
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  return throttled;
}

/** 防抖函数 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
  immediate = false
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (immediate && !timeoutId) {
      fn.apply(this, args);
    }

    timeoutId = setTimeout(() => {
      if (!immediate && lastArgs) {
        fn.apply(lastThis, lastArgs);
      }
      timeoutId = null;
      lastArgs = null;
      lastThis = null;
    }, wait);
  } as T & { cancel: () => void; flush: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      fn.apply(lastThis, lastArgs);
      timeoutId = null;
      lastArgs = null;
      lastThis = null;
    }
  };

  return debounced;
}

/** 批量更新管理器 */
export class BatchUpdater {
  private pending = false;
  private callbacks: Array<() => void> = [];

  /** 添加更新回调 */
  add(callback: () => void): void {
    this.callbacks.push(callback);
    this.schedule();
  }

  /** 调度批量更新 */
  private schedule(): void {
    if (this.pending) return;

    this.pending = true;
    queueMicrotask(() => {
      this.flush();
    });
  }

  /** 执行所有回调 */
  flush(): void {
    const callbacks = this.callbacks;
    this.callbacks = [];
    this.pending = false;

    for (const callback of callbacks) {
      callback();
    }
  }

  /** 清除所有待处理回调 */
  clear(): void {
    this.callbacks = [];
    this.pending = false;
  }
}

/** 对象池 - 减少GC压力 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset?: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    options?: { reset?: (obj: T) => void; maxSize?: number }
  ) {
    this.factory = factory;
    this.reset = options?.reset;
    this.maxSize = options?.maxSize ?? 100;
  }

  /** 获取对象 */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  /** 归还对象 */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset?.(obj);
      this.pool.push(obj);
    }
  }

  /** 清空池 */
  clear(): void {
    this.pool = [];
  }

  /** 获取池大小 */
  get size(): number {
    return this.pool.length;
  }
}

/** 简单的LRU缓存 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 移到最后 (最近使用)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最老的
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
