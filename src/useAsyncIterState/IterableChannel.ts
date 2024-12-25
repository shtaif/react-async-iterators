import { promiseWithResolvers } from '../common/promiseWithResolvers.js';

export { IterableChannel };

class IterableChannel<TVal> {
  #isClosed = false;
  #nextIteration = promiseWithResolvers<IteratorResult<TVal, void>>();
  iterable = {
    [Symbol.asyncIterator]: () => ({
      next: () => this.#nextIteration.promise,
    }),
  };

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
}
