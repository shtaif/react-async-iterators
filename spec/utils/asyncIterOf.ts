export { asyncIterOf };

function asyncIterOf<const T>(...values: T[]) {
  return {
    async *[Symbol.asyncIterator]() {
      yield* values;
    },
  };
}
