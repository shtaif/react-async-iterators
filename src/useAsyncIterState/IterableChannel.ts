import { type MutableRefObject } from 'react';
import { promiseWithResolvers } from '../common/promiseWithResolvers.js';

export { IterableChannel, type AsyncIterableSubject };

class IterableChannel<T> {
  #isClosed = false;
  #nextIteration = promiseWithResolvers<IteratorResult<T, void>>();

  put(value: T): void {
    if (!this.#isClosed) {
      this.values.value.current = value;
      this.#nextIteration.resolve({ done: false, value });
      this.#nextIteration = promiseWithResolvers();
    }
  }

  close(): void {
    this.#isClosed = true;
    this.#nextIteration.resolve({ done: true, value: undefined });
  }

  values: AsyncIterableSubject<T> = {
    value: {
      current: undefined,
    },

    [Symbol.asyncIterator]: () => {
      const whenIteratorClosed = promiseWithResolvers<IteratorReturnResult<undefined>>();
      return {
        next: () => {
          return Promise.race([this.#nextIteration.promise, whenIteratorClosed.promise]);
        },
        return: async () => {
          whenIteratorClosed.resolve({ done: true, value: undefined });
          return { done: true, value: undefined };
        },
      };
    },
  };
}

type AsyncIterableSubject<T> = {
  value: MutableRefObject<T | undefined>;
  [Symbol.asyncIterator](): {
    next(): Promise<IteratorResult<T, void>>;
    return(): Promise<IteratorReturnResult<void>>;
  };
};
