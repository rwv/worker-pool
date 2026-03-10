# @seedgou/worker-pool

🔄 A lightweight and efficient Web Worker pool implementation for TypeScript/JavaScript applications.

## Features

- **Object Pool Pattern**: Reuses idle Web Workers to avoid the overhead of creating and destroying them
- **Configurable Pool Behavior**: Set initial worker count and idle pool capacity
- **TypeScript Support**: Full TypeScript definitions included
- **Zero Dependencies**: Lightweight with no external runtime dependencies
- **Memory Efficient**: Automatically terminates workers returned after the idle pool reaches capacity

## Installation

```bash
npm install @seedgou/worker-pool
```

```bash
pnpm add @seedgou/worker-pool
```

```bash
yarn add @seedgou/worker-pool
```

## Quick Start

```typescript
import { WorkerPool } from "@seedgou/worker-pool";

const createWorker = () => new Worker("/workers/processor.js", { type: "module" });

// Create a worker pool from a zero-argument worker factory
const pool = new WorkerPool(createWorker, {
  initialWorkers: 2,
  maxWorkers: 5,
});

// Get a worker from the pool
const worker = pool.get();

// Use the worker
worker.postMessage({ type: "process", data: "Hello World" });

// Return the worker to the pool when done
pool.return(worker);
```

## API Reference

### `WorkerPool`

The main class for managing a pool of Web Workers.

#### Constructor

```typescript
new WorkerPool(workerConstructor, options?)
```

**Parameters:**

- `workerConstructor`: Zero-argument factory function that creates and returns a new `Worker`
- `options` (optional): Configuration object
  - `initialWorkers` (optional): Number of workers to create initially (default: 0)
  - `maxWorkers` (optional): Maximum number of idle workers to keep in the pool (default: `Infinity`)

#### Methods

##### `get(): Worker`

Gets an idle worker from the pool. If the pool is empty, creates and returns a new worker immediately.

**Returns:** A Worker instance ready for use

##### `return(worker: Worker): void`

Returns a worker to the pool for reuse. If the idle pool has reached `maxWorkers`, the worker will be terminated instead of being retained.

**Parameters:**

- `worker`: The worker to return to the pool

## Usage Examples

### Basic Usage

```typescript
import { WorkerPool } from "@seedgou/worker-pool";

const createWorker = () => new Worker("/workers/echo.js", { type: "module" });

// Create a simple worker pool
const pool = new WorkerPool(createWorker);

// Get a worker and use it
const worker = pool.get();
worker.postMessage("Hello from main thread");

worker.onmessage = (event) => {
  console.log("Received:", event.data);
  // Return worker to pool when done
  pool.return(worker);
};
```

### With Configuration

```typescript
import { WorkerPool } from "@seedgou/worker-pool";

const createWorker = () => new Worker("/workers/processor.js", { type: "module" });

// Create a pool with initial workers and size limit
const pool = new WorkerPool(createWorker, {
  initialWorkers: 3, // Start with 3 workers
  maxWorkers: 10, // Keep up to 10 idle workers available for reuse
});

// The pool starts with 3 workers ready to use
const worker1 = pool.get(); // Gets one of the initial workers
const worker2 = pool.get(); // Gets another initial worker
const worker3 = pool.get(); // Gets the third initial worker
const worker4 = pool.get(); // Creates a new worker (pool was empty)

// Return workers when done
pool.return(worker1);
pool.return(worker2);
pool.return(worker3);
pool.return(worker4);
```

### Reusing Workers Across Tasks

```typescript
import { WorkerPool } from "@seedgou/worker-pool";

const createWorker = () => new Worker("/workers/processor.js", { type: "module" });

const pool = new WorkerPool(createWorker, {
  initialWorkers: 2,
  maxWorkers: 4,
});

async function runTask(task: string) {
  const worker = pool.get();

  try {
    return await new Promise((resolve, reject) => {
      worker.onmessage = (event) => resolve(event.data);
      worker.onerror = reject;
      worker.postMessage(task);
    });
  } finally {
    worker.onmessage = null;
    worker.onerror = null;
    pool.return(worker);
  }
}

for (const task of ["task1", "task2", "task3"]) {
  const result = await runTask(task);
  console.log("Task completed:", result);
}
```

## Why Use a Worker Pool?

Web Workers are expensive to create and destroy. A worker pool provides several benefits:

1. **Performance**: Reusing workers eliminates the overhead of worker creation/destruction
2. **Memory Efficiency**: Limits how many idle workers are retained for reuse
3. **Resource Management**: Automatically terminates workers returned after the idle pool is full
4. **Scalability**: Useful when tasks frequently borrow and return workers

## Important Note About `maxWorkers`

`maxWorkers` does **not** cap the number of workers that can be active at the same time.

`WorkerPool#get()` always returns immediately. If no idle worker is available, it creates a new one. `maxWorkers` only controls how many returned workers are kept around for reuse.

If you need a hard concurrency limit for task execution, add your own queue, semaphore, or scheduler on top of `WorkerPool`.

## Development

### Prerequisites

- Node.js 20.19+ or 22.12+
- pnpm (recommended) or npm

### Setup

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm coverage

# Lint code
pnpm lint

# Format code
pnpm format
```

### Scripts

- `build`: Compile TypeScript to JavaScript
- `test`: Run tests with Vitest
- `coverage`: Run tests with coverage report
- `lint`: Lint and fix code with Oxlint
- `lint-check`: Check linting with Oxlint
- `format`: Format the repository with Oxfmt
- `format-check`: Check formatting with Oxfmt
- `type-check`: Run TypeScript type checking

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Repository

- **GitHub**: https://github.com/rwv/worker-pool
- **Issues**: https://github.com/rwv/worker-pool/issues
