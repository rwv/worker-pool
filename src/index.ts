export type WorkerConstructor = () => Worker;

/**
 * A pool for managing Web Workers to avoid the overhead of creating and destroying workers.
 *
 * This class implements a simple object pool pattern for Web Workers. When a worker is needed,
 * it first checks if there's an available worker in the pool. If not, it creates a new one.
 * When a worker is no longer needed, it can be returned to the pool for reuse.
 *
 * @example
 * ```typescript
 * const pool = new WorkerPool(Worker)
 *
 * // Get a worker from the pool
 * const worker = pool.get()
 *
 * // Use the worker...
 * worker.postMessage('Hello')
 *
 * // Return the worker to the pool when done
 * pool.return(worker)
 * ```
 */
export class WorkerPool {
  /** Set of available workers in the pool */
  private readonly workersPool = new Set<Worker>();

  /** Constructor function for creating new workers when the pool is empty */
  private readonly workerConstructor: WorkerConstructor;

  /** Maximum number of workers in the pool */
  private readonly maxWorkers: number;

  /**
   * Creates a new WorkerPool instance.
   *
   * @param workerConstructor - The constructor function for creating new workers.
   *                           This is typically the `Worker` class or a custom worker class.
   * @param options - Optional configuration for the worker pool
   * @param options.initialWorkers - Number of workers to create initially (default: 0)
   * @param options.maxWorkers - Maximum number of workers to keep in the pool (default: Infinity)
   */
  constructor(
    workerConstructor: WorkerConstructor,
    options?: {
      initialWorkers?: number;
      maxWorkers?: number;
    },
  ) {
    this.workerConstructor = workerConstructor;
    this.maxWorkers = options?.maxWorkers ?? Infinity;

    for (let i = 0; i < (options?.initialWorkers ?? 0); i++) {
      this.workersPool.add(this.workerConstructor());
    }
  }

  /**
   * Gets a worker from the pool.
   *
   * If there are available workers in the pool, returns one and removes it from the pool.
   * If the pool is empty, creates and returns a new worker.
   *
   * @returns A worker instance ready for use
   */
  get(): Worker {
    const worker = this.workersPool.values().next().value;

    if (worker) {
      this.workersPool.delete(worker);
      return worker;
    } else {
      return this.workerConstructor();
    }
  }

  /**
   * Returns a worker to the pool for reuse.
   *
   * The worker should be in a clean state before being returned to the pool.
   * Workers returned to the pool will be available for subsequent calls to `get()`.
   * If the pool has reached its maximum capacity, the worker will be terminated instead.
   *
   * @param worker - The worker to return to the pool
   */
  return(worker: Worker): void {
    if (this.workersPool.size >= this.maxWorkers) {
      worker.terminate();
      return;
    }

    this.workersPool.add(worker);
  }
}
