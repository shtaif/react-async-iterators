import {
  reactAsyncIterSpecialInfoSymbol,
  type ReactAsyncIterSpecialInfo,
} from '../common/reactAsyncIterSpecialInfoSymbol.js';
import { asyncIterSyncMap } from '../common/asyncIterSyncMap.js';
import { isAsyncIter } from '../common/isAsyncIter.js';
import { type ExtractAsyncIterValue } from '../common/ExtractAsyncIterValue.js';
import { type useAsyncIter } from '../useAsyncIter/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { type Iterate } from '../Iterate/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars

export { iterateFormatted, type FixedRefFormattedIterable };

/**
 * An optional utility to format an async iterable's values inline right where its passing into
 * an other consuming component.
 *
 * @example
 * ```tsx
 * // Allows this:
 *
 * import { iterateFormatted } from 'react-async-iterators';
 *
 * function MyComponent(props) {
 *   return (
 *     <MyDropdown
 *       optionsIter={iterateFormatted(props.iter, ({ id, name }) => ({
 *         value: id,
 *         label: name,
 *       }))}
 *     />
 *   );
 * }
 *
 * // ...instead of this:
 *
 * import { useMemo } from 'react';
 *
 * function MyComponent(props) {
 *   const dropdownOpts = useMemo( // `useMemo` with some `mapAsyncIter` third-party mapping helper:
 *     () =>
 *       mapAsyncIter(props.iter, ({ id, name }) => ({
 *         value: id,
 *         label: name,
 *       })),
 *     [props.iter]
 *   );
 *
 *   return <MyDropdown optionsIter={dropdownOpts} />;
 * }
 * ```
 *
 * This utility should come handy in places when you need a formatted (or _"mapped"_) version of
 * some existing async iterable before passing it as prop into an other component which consumes it
 * and you rather have the transformation written right next to the place instead of far from it
 * in the top as some `useMemo` hook call.
 *
 * The utility's method of operation is it will take `source` and return from it a new transformed
 * async iterable object with some special metadata attached that tells library tools like
 * {@link Iterate `<Iterate>`} and {@link useAsyncIter `useAsyncIter`} the actual source object
 * to base the iteration process on instead of on the root object itself. This way, the root object
 * may be repeatedly recreated without any effect of restarting the iteration process - as long
 * as the `source` is repeatedly passed the same base object.
 *
 * If `source` is a plain value and not an async iterable, it will be passed to the given `formatFn`
 * and returned on the spot.
 *
 * @template TIn The type of values yielded by the passed iterable or of a plain value passed otherwise.
 * @template TOut The type of values resulting after formatting.
 *
 * @param source Any async iterable or plain value.
 * @param formatFn Function that performs formatting/mapping logic for each value of `source`
 *
 * @returns a transformed async iterable emitting every value of `source` after formatting.
 */
function iterateFormatted<TIn, TOut>(
  source: TIn,
  formatFn: (value: ExtractAsyncIterValue<TIn>, i: number) => TOut
): TIn extends AsyncIterable<unknown>
  ? FixedRefFormattedIterable<ExtractAsyncIterValue<TIn>, TOut>
  : TOut;

function iterateFormatted(
  source: unknown,
  formatFn: (value: unknown, i: number) => unknown
): unknown {
  if (!isAsyncIter(source)) {
    return formatFn(source, 0);
  }

  const sourceSpecialInfo = (source as any)?.[reactAsyncIterSpecialInfoSymbol] as
    | undefined
    | ReactAsyncIterSpecialInfo<unknown, unknown>;

  return {
    [Symbol.asyncIterator]: () => asyncIterSyncMap(source, formatFn)[Symbol.asyncIterator](),
    [reactAsyncIterSpecialInfoSymbol]: !sourceSpecialInfo
      ? {
          origSource: source,
          formatFn,
        }
      : {
          origSource: sourceSpecialInfo.origSource,
          formatFn: (value: unknown, i: number) => {
            const prevMapResult = sourceSpecialInfo.formatFn(value, i);
            return formatFn(prevMapResult, i);
          },
        },
  };
}

type FixedRefFormattedIterable<TVal, TValFormatted> = AsyncIterable<TValFormatted, void, void> & {
  [reactAsyncIterSpecialInfoSymbol]: ReactAsyncIterSpecialInfo<TVal, TValFormatted>;
};
