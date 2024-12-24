import { type ExtractAsyncIterValue } from './ExtractAsyncIterValue.js';

export { isAsyncIter };

function isAsyncIter<T>(input: T): input is T & AsyncIterable<ExtractAsyncIterValue<T>> {
  return typeof (input as any)?.[Symbol.asyncIterator] === 'function';
}
