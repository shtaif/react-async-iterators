export { iterateAsyncIterWithCallbacks, type EndIterationFn };

function iterateAsyncIterWithCallbacks<T>(
  iterable: AsyncIterable<T>,
  initialValue: T,
  changeCb: (
    change: { value: T } & (
      | {
          done: false;
          error: undefined;
        }
      | {
          done: true;
          error: unknown;
        }
    )
  ) => void
): EndIterationFn {
  const iterator = iterable[Symbol.asyncIterator]();
  let iteratorClosedByConsumer = false;
  let lastValue = initialValue;

  (async () => {
    try {
      for await (const value of { [Symbol.asyncIterator]: () => iterator }) {
        if (!iteratorClosedByConsumer && !Object.is(value, lastValue)) {
          lastValue = value;
          changeCb({ value, done: false, error: undefined });
        }
      }
      if (!iteratorClosedByConsumer) {
        changeCb({ value: lastValue, done: true, error: undefined });
      }
    } catch (err) {
      if (!iteratorClosedByConsumer) {
        changeCb({ value: lastValue, done: true, error: err });
      }
    }
  })();

  return () => {
    if (!iteratorClosedByConsumer) {
      iteratorClosedByConsumer = true;
      iterator.return?.();
    }
  };
}

type EndIterationFn = () => void;
