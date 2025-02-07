import { useAsyncIterMemo } from '../common/hooks/useAsyncIterMemo/index.js';
import { isAsyncIter } from '../common/isAsyncIter.js';
import { asyncIterShare } from '../common/iterOperators/asyncIterShare.js';
import { type MaybeAsyncIterable } from '../MaybeAsyncIterable/index.js';

export { useSharedAsyncIter };

/**
 * Hook that takes a source async iterable and returns a version of it that will always initialize up to
 * just one single instance of the source at any point in time, sharing it to any number of simultaneous consumers
 * the result iterable might have (e.g multiple `<It>`s).
 *
 * @example
 * ```ts
 * const sharedIter = useSharedAsyncIter(iter);
 * // ...
 * ```
 *
 * Any number of iterators for the resulting iterable you create and consume simultaneously will only ever
 * create a single iterator internally for the original source and distribute every yielded value, completion or
 * possible error among each of them.
 *
 * In a _reference-counting_ fashion, only when the last remaining iterator is closed will the shared
 * source iterator be finally closed as well, disposing of resources it held, after which instantiating a new
 * iterator will restart the cycle. This way, async iterables that instantiate server connections, streams,
 * etc. - can easily be consumed or rendered concurrently by multiple components without possibly opening
 * duplicate resources or other undesired effects, depending on the way these source iterables were constructed.
 *
 * Repeated calls with the same source iterable will return the same memoized result iterable, as well as calls
 * with `iterateFormatted`-returned iterables based of the same source for that matter.
 *
 * If given a plain non-iterable value, this hook would seamlessly return it as-is without additional effect.
 *
 * ---
 *
 * @template T The type for the source async iterable's values or in case of a plain value the source's type itself.
 *
 * @param value The source async iterable or plain value.
 *
 * @returns A shared version of the source async iterable or the source value itself in case it was a plain value.
 *
 * ---
 *
 * @example
 * ```ts
 * import { useSharedAsyncIter, It } from 'react-async-iterators';
 *
 * function MyComponent(props) {
 *   const messagesIter = useSharedAsyncIter(props.messagesIter);
 *
 *   return (
 *     <div>
 *       Number of unread messages:
 *       <It value={messagesIter}>
 *         {next => (
 *           next.value?.filter(msg => msg.isRead).length ?? 0
 *         )}
 *       </It>
 *
 *       Message list:
 *       <It value={messagesIter}>
 *         {next => (
 *           next.value?.map(msg => (
 *             <div>
 *               From: {msg.from},
 *               Date: {msg.date},
 *               Was read: {msg.isRead ? 'Y' : 'N'}
 *             </div>
 *           ))
 *         )}
 *       </It>
 *     </div>
 *   );
 * }
 * ```
 */
function useSharedAsyncIter<T>(value: AsyncIterable<T>): AsyncIterable<T>;
function useSharedAsyncIter<T>(value: T): T;
function useSharedAsyncIter(value: unknown): MaybeAsyncIterable<unknown> {
  return useAsyncIterMemo(
    value => (!isAsyncIter(value) ? value : asyncIterShare<unknown>()(value)),
    [value]
  );
}

// TODO: Enhance `useSharedAsyncIter`'s returned iter to have the `.return` method as NOT optional?
