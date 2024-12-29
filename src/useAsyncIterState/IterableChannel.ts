import { promiseWithResolvers } from '../common/promiseWithResolvers.js';

export { IterableChannel };

class IterableChannel<TVal> {
  #isClosed = false;
  #nextIteration = promiseWithResolvers<IteratorResult<TVal, void>>();

  put(value: TVal): void {
    if (!this.#isClosed) {
      this.#nextIteration.resolve({ done: false, value });
      this.#nextIteration = promiseWithResolvers();
    }
  }

  close(): void {
    this.#isClosed = true;
    this.#nextIteration.resolve({ done: true, value: undefined });
  }

  iterable: {
    [Symbol.asyncIterator](): {
      next(): Promise<IteratorResult<TVal, void>>;
      return(): Promise<IteratorReturnResult<void>>;
    };
  } = {
    [Symbol.asyncIterator]: () => {
      const whenIteratorClosed = promiseWithResolvers<IteratorReturnResult<undefined>>();

      return {
        next: () => {
          return Promise.race([this.#nextIteration.promise, whenIteratorClosed.promise]);
        },

        return: async () => {
          whenIteratorClosed.resolve({ done: true, value: undefined });
          return { done: true as const, value: undefined };
        },
      };
    },
  };
}
