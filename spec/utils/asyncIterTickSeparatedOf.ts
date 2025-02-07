import { nextTick } from 'node:process';

export { asyncIterTickSeparatedOf };

function asyncIterTickSeparatedOf<const T>(...values: T[]): {
  [Symbol.asyncIterator](): AsyncGenerator<T, void, void>;
} {
  return {
    async *[Symbol.asyncIterator]() {
      await new Promise(resolve => nextTick(resolve));
      yield* values;
    },
  };
}
