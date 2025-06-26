import { describe, it, expect, vi } from "vitest";
import { WorkerPool } from "./index";

// Mock Worker class for testing
class MockWorker {
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: ErrorEvent) => void) | null = null;

  public terminate(): void {
    // Mock implementation
  }
}

describe("WorkerPool", () => {
  const workerConstructor = () => new MockWorker() as unknown as Worker;

  describe("constructor", () => {
    it("should create a WorkerPool with default options", () => {
      const pool = new WorkerPool(workerConstructor);
      expect(pool).toBeInstanceOf(WorkerPool);
    });

    it("should create a WorkerPool with initial workers", () => {
      const pool = new WorkerPool(workerConstructor, {
        initialWorkers: 3,
      });

      // Get all workers to verify they were created
      const workers: Worker[] = [];
      for (let i = 0; i < 3; i++) {
        workers.push(pool.get());
      }

      expect(workers).toHaveLength(3);
      workers.forEach((worker) => {
        expect(worker).toBeInstanceOf(MockWorker);
      });
    });

    it("should create a WorkerPool with zero initial workers by default", () => {
      const pool = new WorkerPool(workerConstructor);

      // The pool should be empty initially
      const worker = pool.get();
      expect(worker).toBeInstanceOf(MockWorker);
    });
  });

  describe("get", () => {
    it("should return a new worker when pool is empty", () => {
      const workerPool = new WorkerPool(workerConstructor);
      const worker = workerPool.get();
      expect(worker).toBeInstanceOf(MockWorker);
    });

    it("should return a worker from the pool when available", () => {
      const workerPool = new WorkerPool(workerConstructor);
      // First, get a worker
      const worker1 = workerPool.get();

      // Return it to the pool
      workerPool.return(worker1);

      // Get another worker - should be the same one from the pool
      const worker2 = workerPool.get();
      expect(worker2).toBe(worker1);
    });

    it("should create new workers when pool is empty", () => {
      const workerPool = new WorkerPool(workerConstructor);
      const worker1 = workerPool.get();
      const worker2 = workerPool.get();

      expect(worker1).not.toBe(worker2);
      expect(worker1).toBeInstanceOf(MockWorker);
      expect(worker2).toBeInstanceOf(MockWorker);
    });
  });

  describe("return", () => {
    it("should add a worker back to the pool", () => {
      const workerPool = new WorkerPool(workerConstructor);
      const worker = workerPool.get();
      workerPool.return(worker);

      // Get the worker again - should be the same instance
      const returnedWorker = workerPool.get();
      expect(returnedWorker).toBe(worker);
    });

    it("should allow returning multiple workers to the pool", () => {
      const workerPool = new WorkerPool(workerConstructor);
      const worker1 = workerPool.get();
      const worker2 = workerPool.get();

      workerPool.return(worker1);
      workerPool.return(worker2);

      // Get workers back - should get the returned workers
      const returnedWorker1 = workerPool.get();
      const returnedWorker2 = workerPool.get();

      expect(returnedWorker1).toBe(worker1);
      expect(returnedWorker2).toBe(worker2);
    });

    it("should handle returning the same worker multiple times", () => {
      const workerPool = new WorkerPool(workerConstructor);
      const worker = workerPool.get();

      workerPool.return(worker);
      workerPool.return(worker);

      // Should only get the worker once
      const returnedWorker1 = workerPool.get();
      const returnedWorker2 = workerPool.get();

      expect(returnedWorker1).toBe(worker);
      expect(returnedWorker2).not.toBe(worker); // Should be a new worker
    });
  });

  describe("maxWorkers", () => {
    it("should create a WorkerPool with maxWorkers limit", () => {
      const pool = new WorkerPool(workerConstructor, {
        maxWorkers: 2,
      });
      expect(pool).toBeInstanceOf(WorkerPool);
    });

    it("should limit the number of workers kept in the pool", () => {
      const pool = new WorkerPool(workerConstructor, {
        maxWorkers: 2,
      });

      // Get workers and return them to fill the pool
      const worker1 = pool.get();
      const worker2 = pool.get();
      const worker3 = pool.get();

      // Return all three workers
      pool.return(worker1);
      pool.return(worker2);
      pool.return(worker3);

      // Get workers back - should only get 2 from the pool
      const returnedWorker1 = pool.get();
      const returnedWorker2 = pool.get();
      const returnedWorker3 = pool.get();

      // The first two should be from the pool (reused workers)
      expect(returnedWorker1).toBe(worker1);
      expect(returnedWorker2).toBe(worker2);
      // The third should be a new worker (the third was terminated)
      expect(returnedWorker3).not.toBe(worker3);
      expect(returnedWorker3).toBeInstanceOf(MockWorker);
    });

    it("should terminate workers when pool is at max capacity", () => {
      const pool = new WorkerPool(workerConstructor, {
        maxWorkers: 1,
      });

      // Mock the terminate method to track calls
      const worker1 = pool.get();
      const worker2 = pool.get();

      const terminateSpy1 = vi.spyOn(worker1, "terminate");
      const terminateSpy2 = vi.spyOn(worker2, "terminate");

      // Return both workers - the second one should be terminated
      pool.return(worker1);
      pool.return(worker2);

      expect(terminateSpy1).not.toHaveBeenCalled();
      expect(terminateSpy2).toHaveBeenCalledOnce();

      // Get a worker back - should be the first one
      const returnedWorker = pool.get();
      expect(returnedWorker).toBe(worker1);
    });

    it("should work correctly with initialWorkers and maxWorkers", () => {
      const pool = new WorkerPool(workerConstructor, {
        initialWorkers: 1,
        maxWorkers: 1,
      });

      // Get all initial workers
      const worker1 = pool.get();
      const worker2 = pool.get();
      const terminateSpy2 = vi.spyOn(worker2, "terminate");

      pool.return(worker1);
      pool.return(worker2);

      // worker1 should be terminated because pool is at max capacity (1 worker)
      expect(terminateSpy2).toHaveBeenCalledOnce();
    });

    it("should handle edge case of maxWorkers = 0", () => {
      const pool = new WorkerPool(workerConstructor, {
        maxWorkers: 0,
      });

      const worker = pool.get();
      const terminateSpy = vi.spyOn(worker, "terminate");

      // Any worker returned should be terminated immediately
      pool.return(worker);

      expect(terminateSpy).toHaveBeenCalledOnce();

      // Getting a new worker should work normally
      const newWorker = pool.get();
      expect(newWorker).toBeInstanceOf(MockWorker);
    });

    it("should handle maxWorkers = 1 correctly", () => {
      const pool = new WorkerPool(workerConstructor, {
        maxWorkers: 1,
      });

      const worker1 = pool.get();
      const worker2 = pool.get();

      // Return first worker - should be kept in pool
      pool.return(worker1);

      // Return second worker - should be terminated
      const terminateSpy = vi.spyOn(worker2, "terminate");
      pool.return(worker2);
      expect(terminateSpy).toHaveBeenCalledOnce();

      // Get worker back - should be the first one
      const returnedWorker = pool.get();
      expect(returnedWorker).toBe(worker1);
    });

    it("should work correctly with multiple get/return cycles at max capacity", () => {
      const pool = new WorkerPool(workerConstructor, {
        maxWorkers: 2,
      });

      // Get initial workers
      const worker1 = pool.get();
      const worker2 = pool.get();

      // Return them
      pool.return(worker1);
      pool.return(worker2);

      // Get them back
      const returnedWorker1 = pool.get();
      const returnedWorker2 = pool.get();

      expect(returnedWorker1).toBe(worker1);
      expect(returnedWorker2).toBe(worker2);

      // Get a third worker
      const worker3 = pool.get();

      // Return all three - the third should be terminated
      const terminateSpy = vi.spyOn(worker3, "terminate");
      pool.return(returnedWorker1);
      pool.return(returnedWorker2);
      pool.return(worker3);

      expect(terminateSpy).toHaveBeenCalledOnce();

      // Get workers back - should get the first two
      const finalWorker1 = pool.get();
      const finalWorker2 = pool.get();

      expect(finalWorker1).toBe(returnedWorker1);
      expect(finalWorker2).toBe(returnedWorker2);
    });
  });

  describe("integration", () => {
    it("should work correctly with multiple get/return cycles", () => {
      const workerPool = new WorkerPool(workerConstructor);
      // Get initial workers
      const worker1 = workerPool.get();
      const worker2 = workerPool.get();

      // Return them
      workerPool.return(worker1);
      workerPool.return(worker2);

      // Get them back
      const returnedWorker1 = workerPool.get();
      const returnedWorker2 = workerPool.get();

      expect(returnedWorker1).toBe(worker1);
      expect(returnedWorker2).toBe(worker2);

      // Return one and get it back
      workerPool.return(returnedWorker1);
      const finalWorker = workerPool.get();
      expect(finalWorker).toBe(worker1);
    });

    it("should handle mixed scenarios with pool and new workers", () => {
      const workerPool = new WorkerPool(workerConstructor);
      // Get initial worker
      const worker1 = workerPool.get();

      // Return it
      workerPool.return(worker1);

      // Get it back
      const returnedWorker1 = workerPool.get();
      expect(returnedWorker1).toBe(worker1);

      // Get a new worker (pool is empty again)
      const worker2 = workerPool.get();
      expect(worker2).not.toBe(worker1);

      // Return both
      workerPool.return(returnedWorker1);
      workerPool.return(worker2);

      // Get both back
      const finalWorker1 = workerPool.get();
      const finalWorker2 = workerPool.get();

      expect(finalWorker1).toBe(returnedWorker1);
      expect(finalWorker2).toBe(worker2);
    });
  });
});
