import { useAsyncIterMemo } from '../common/hooks/useAsyncIterMemo/index.js';
import { isAsyncIter } from '../common/isAsyncIter.js';
import { asyncIterShare } from '../common/iterOperators/asyncIterShare.js';
import { type MaybeAsyncIterable } from '../MaybeAsyncIterable/index.js';

export { useSharedAsyncIter };

// TODO: Enhance `useSharedAsyncIter`'s returned iter to have the `.return` method NOT optional?

function useSharedAsyncIter<T>(value: AsyncIterable<T>): AsyncIterable<T>;
function useSharedAsyncIter<T>(value: T): T;
function useSharedAsyncIter(value: unknown): MaybeAsyncIterable<unknown> {
  return useAsyncIterMemo(
    value => (!isAsyncIter(value) ? value : asyncIterShare<unknown>()(value)),
    [value]
  );
}
