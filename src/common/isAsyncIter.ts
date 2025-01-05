import { type ExtractAsyncIterValue } from './ExtractAsyncIterValue.js';

export { isAsyncIter };

function isAsyncIter<T>(input: T): input is T & AsyncIterable<ExtractAsyncIterValue<T>> {
  const inputAsAny = input as any;
  return typeof inputAsAny?.[Symbol.asyncIterator] === 'function';
}
