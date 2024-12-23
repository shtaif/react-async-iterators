export { asyncIterSyncMap };

function asyncIterSyncMap<TIn, TOut>(
  source: AsyncIterable<TIn>,
  mapFn: (val: TIn, i: number) => TOut
): AsyncIterable<TOut, void, void> {
  return {
    [Symbol.asyncIterator]: () => {
      let iterator: AsyncIterator<TIn>;
      let iterationIdx = 0;

      return {
        next: async () => {
          iterator ??= source[Symbol.asyncIterator]();
          const next = await iterator.next();
          if (next.done) {
            return next;
          }
          const mappedValue = mapFn(next.value, iterationIdx++);
          return { done: false, value: mappedValue };
        },

        return: async () => {
          await iterator?.return?.();
          return { done: true, value: undefined };
        },
      };
    },
  };
}
