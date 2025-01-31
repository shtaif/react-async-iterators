import { type DeasyncIterized } from './DeasyncIterized.js';

export { isAsyncIter };

function isAsyncIter<T>(input: T): input is T & AsyncIterable<DeasyncIterized<T>> {
  const inputAsAny = input as any;
  return typeof inputAsAny?.[Symbol.asyncIterator] === 'function';
}
