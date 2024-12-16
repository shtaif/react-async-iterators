export { isAsyncIter };

function isAsyncIter<T>(input: T): input is T & AsyncIterable<unknown> {
  return typeof (input as any)?.[Symbol.asyncIterator] === 'function';
}
