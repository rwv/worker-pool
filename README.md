# @seedgou/worker-pool

🔄 A lightweight and efficient Web Worker pool implementation for TypeScript/JavaScript applications.

## Features

- **Object Pool Pattern**: Reuses Web Workers to avoid the overhead of creating and destroying them
- **Configurable Pool Size**: Set initial and maximum worker counts
- **TypeScript Support**: Full TypeScript definitions included
- **Zero Dependencies**: Lightweight with no external runtime dependencies
- **Memory Efficient**: Automatically terminates excess workers when pool reaches capacity

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

// Create a worker pool
const pool = new WorkerPool(Worker, {
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

- `workerConstructor`: Function that creates new Worker instances (typically the `Worker` class)
- `options` (optional): Configuration object
  - `initialWorkers` (optional): Number of workers to create initially (default: 0)
  - `maxWorkers` (optional): Maximum number of workers to keep in the pool (default: Infinity)

#### Methods

##### `get(): Worker`

Gets a worker from the pool. If the pool is empty, creates and returns a new worker.

**Returns:** A Worker instance ready for use

##### `return(worker: Worker): void`

Returns a worker to the pool for reuse. If the pool has reached its maximum capacity, the worker will be terminated instead.

**Parameters:**

- `worker`: The worker to return to the pool

## Usage Examples

### Basic Usage

```typescript
import { WorkerPool } from "@seedgou/worker-pool";

// Create a simple worker pool
const pool = new WorkerPool(Worker);

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

// Create a pool with initial workers and size limit
const pool = new WorkerPool(Worker, {
  initialWorkers: 3, // Start with 3 workers
  maxWorkers: 10, // Maximum 10 workers in pool
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

### Processing Multiple Tasks

```typescript
import { WorkerPool } from "@seedgou/worker-pool";

const pool = new WorkerPool(Worker, { maxWorkers: 4 });

async function processTasks(tasks: string[]) {
  const promises = tasks.map(async (task) => {
    const worker = pool.get();

    return new Promise((resolve, reject) => {
      worker.onmessage = (event) => {
        resolve(event.data);
        pool.return(worker);
      };

      worker.onerror = (error) => {
        reject(error);
        pool.return(worker);
      };

      worker.postMessage(task);
    });
  });

  return Promise.all(promises);
}

// Usage
const tasks = ["task1", "task2", "task3", "task4", "task5"];
processTasks(tasks).then((results) => {
  console.log("All tasks completed:", results);
});
```

## Why Use a Worker Pool?

Web Workers are expensive to create and destroy. A worker pool provides several benefits:

1. **Performance**: Reusing workers eliminates the overhead of worker creation/destruction
2. **Memory Efficiency**: Limits the number of concurrent workers
3. **Resource Management**: Automatically handles worker lifecycle
4. **Scalability**: Better performance under high load

## Development

### Prerequisites

- Node.js 18+
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
- `lint`: Lint and fix code
- `lint-check`: Check linting without fixing
- `format`: Format code with Prettier
- `format-check`: Check formatting without fixing
- `type-check`: Run TypeScript type checking

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Repository

- **GitHub**: https://github.com/rwv/worker-pool
- **Issues**: https://github.com/rwv/worker-pool/issues
