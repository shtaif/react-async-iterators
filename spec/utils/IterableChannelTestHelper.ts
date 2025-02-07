export { IterableChannelTestHelper };

class IterableChannelTestHelper<T> implements AsyncIterable<T, void, void> {
  #isClosed = false;
  #nextIteration = Promise.withResolvers<IteratorResult<T, void>>();

  put(value: T): void {
    if (!this.#isClosed) {
      this.#nextIteration.resolve({ done: false, value });
      this.#nextIteration = Promise.withResolvers();
    }
  }

  close(): void {
    this.#isClosed = true;
    this.#nextIteration.resolve({ done: true, value: undefined });
  }

  [Symbol.asyncIterator]() {
    const whenIteratorClosed = Promise.withResolvers<IteratorReturnResult<undefined>>();

    return {
      next: (): Promise<IteratorResult<T, void>> => {
        return Promise.race([this.#nextIteration.promise, whenIteratorClosed.promise]);
      },

      return: async (): Promise<IteratorReturnResult<void>> => {
        whenIteratorClosed.resolve({ done: true, value: undefined });
        return { done: true, value: undefined };
      },
    };
  }
}
