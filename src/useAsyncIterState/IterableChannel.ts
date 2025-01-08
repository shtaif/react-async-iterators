import { type MutableRefObject } from 'react';
import { promiseWithResolvers } from '../common/promiseWithResolvers.js';

export { IterableChannel, type AsyncIterableSubject };

class IterableChannel<T, TInit = T> {
  #isClosed = false;
  #nextIteration = promiseWithResolvers<IteratorResult<T, void>>();
  #currentValue: T | TInit;

  constructor(initialValue: TInit) {
    this.#currentValue = initialValue;
  }

  put(update: T | ((prevState: T | TInit) => T)): void {
    if (!this.#isClosed) {
      const value =
        typeof update !== 'function'
          ? update
          : (() => {
              const updateFnTypePatched = update as (prevState: T | TInit) => T;
              return updateFnTypePatched(this.#currentValue);
            })();

      (async () => {
        this.#currentValue = value;
        await undefined; // Deferring to the next microtick so that an attempt to pull the a value before making multiple rapid synchronous calls to `put()` will make that pull ultimately yield only the last value that was put - instead of the first one as were if this otherwise wasn't deferred.
        this.#nextIteration.resolve({ done: false, value: this.#currentValue });
        this.#nextIteration = promiseWithResolvers();
      })();
    }
  }

  close(): void {
    this.#isClosed = true;
    this.#nextIteration.resolve({ done: true, value: undefined });
  }

  values: AsyncIterableSubject<T, TInit> = {
    value: (() => {
      const self = this;
      return {
        get current() {
          return self.#currentValue;
        },
      };
    })(),

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

/**
 * A stateful async iterable which will yield every updated value following an update. Includes a
 * `.current.value` property which shows the current up to date state value.
 *
 * This is a shared async iterable - all iterators obtained from it share the same source values,
 * meaning that multiple iterators can be consumed (iterated) simultaneously and each one would pick up
 * the same values as others the moment they were generated through state updates.
 */
type AsyncIterableSubject<T, TInit> = {
  /**
   * A React Ref-like object whose inner `current` property shows the most up to date state value.
   */
  value: Readonly<MutableRefObject<T | TInit>>;

  /**
   * Returns an async iterator to iterate over. All iterators returned by this share the same source
   * values - they can be iterated by multiple consumers simultaneously and each would pick up the
   * same values as others the moment they were generated.
   */
  [Symbol.asyncIterator](): {
    next(): Promise<IteratorResult<T, void>>;
    return(): Promise<IteratorReturnResult<void>>;
  };
};
