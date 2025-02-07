export { asyncIterShare };

function asyncIterShare<T>(): (srcIter: AsyncIterable<T>) => AsyncIterable<T> {
  return srcIter => {
    let sharedSourceIterator: AsyncIterator<T>;
    let prevSourceIteratorActiveTearDownPromise: undefined | Promise<unknown>;
    let nextPromise: undefined | Promise<IteratorResult<T, undefined>>;
    let activeSubIteratorsCount = 0;

    return {
      [Symbol.asyncIterator]() {
        let iteratorClosed = false;
        const whenIteratorCloses = Promise.withResolvers<IteratorReturnResult<undefined>>();

        if (++activeSubIteratorsCount === 1) {
          sharedSourceIterator = srcIter[Symbol.asyncIterator]();
        }

        return {
          async next() {
            if (prevSourceIteratorActiveTearDownPromise) {
              await prevSourceIteratorActiveTearDownPromise;
            }
            if (iteratorClosed) {
              return { done: true, value: undefined };
            }
            nextPromise ??= sharedSourceIterator.next().finally(() => {
              nextPromise = undefined;
            });
            return Promise.race([whenIteratorCloses.promise, nextPromise]);
          },

          async return() {
            if (!iteratorClosed) {
              iteratorClosed = true;
              if (--activeSubIteratorsCount === 0) {
                await (prevSourceIteratorActiveTearDownPromise ??= (async () => {
                  try {
                    if (sharedSourceIterator.return) {
                      await sharedSourceIterator.return();
                    }
                  } finally {
                    prevSourceIteratorActiveTearDownPromise = undefined;
                  }
                })());
              }
              whenIteratorCloses.resolve({ done: true, value: undefined });
              await whenIteratorCloses.promise;
            }
            return { done: true, value: undefined };
          },
        };
      },
    };
  };
}
