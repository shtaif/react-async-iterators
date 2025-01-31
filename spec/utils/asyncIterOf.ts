export { asyncIterOf };

function asyncIterOf(...values: []): AsyncIterable<never>;
function asyncIterOf<const T>(...values: T[]): AsyncIterable<T>;
function asyncIterOf<const T>(...values: T[]): AsyncIterable<T> {
  return {
    async *[Symbol.asyncIterator]() {
      yield* values;
    },
  };
}
