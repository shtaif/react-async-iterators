export { type AsyncIterableSubject };

/**
 * Represents a concept of an async iterable object with a notion of a current value, which is
 * publicly readable via a property.
 */
type AsyncIterableSubject<T, TCurrVal = T> = AsyncIterable<T> & {
  /**
   * A React Ref-like object whose inner `current` property shows the most up to date state value.
   */

  value: {
    readonly current: T | TCurrVal;
  };
};
