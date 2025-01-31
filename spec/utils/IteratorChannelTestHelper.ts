import { vi, type MockInstance } from 'vitest';

export { IteratorChannelTestHelper };

class IteratorChannelTestHelper<T> implements AsyncIterableIterator<T>, AsyncDisposable {
  #isChannelClosed = false;
  #nextIteration = Promise.withResolvers<IteratorResult<T>>();

  [Symbol.asyncIterator]() {
    return this;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.complete();
  }

  get isClosed(): boolean {
    return this.#isChannelClosed;
  }

  put(value: T): void {
    if (this.#isChannelClosed) {
      return;
    }
    this.#nextIteration.resolve({ done: false, value });
    this.#nextIteration = Promise.withResolvers();
  }

  complete(): void {
    this.#isChannelClosed = true;
    this.#nextIteration.resolve({ done: true, value: undefined });
  }

  error(errValue?: unknown): void {
    this.#isChannelClosed = true;
    this.#nextIteration.reject(errValue);
    this.#nextIteration = Promise.withResolvers();
    this.#nextIteration.resolve({ done: true, value: undefined });
  }

  async #_return(): Promise<IteratorReturnResult<void>> {
    this.complete();
    const res = await this.#nextIteration.promise;
    return res as typeof res & { done: true };
  }

  async next(): Promise<IteratorResult<T, void>> {
    return this.#nextIteration.promise;
  }

  return = (): Promise<IteratorReturnResult<void>> => this.#_return();

  returnSpy: MockInstance<() => Promise<IteratorReturnResult<void>>> = vi.spyOn(
    this as IteratorChannelTestHelper<T>,
    'return'
  );
}
