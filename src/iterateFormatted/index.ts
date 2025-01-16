import {
  reactAsyncIterSpecialInfoSymbol,
  type ReactAsyncIterable,
  type ReactAsyncIterSpecialInfo,
} from '../common/ReactAsyncIterable.js';
import { asyncIterSyncMap } from '../common/asyncIterSyncMap.js';
import { isAsyncIter } from '../common/isAsyncIter.js';
import { type ExtractAsyncIterValue } from '../common/ExtractAsyncIterValue.js';
import { type AsyncIterableSubject } from '../AsyncIterableSubject/index.js';
import { type useAsyncIter } from '../useAsyncIter/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { type Iterate } from '../Iterate/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars

export { iterateFormatted };

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
 *   const dropdownOpts = useMemo( // `useMemo` with some pseudo third-party mapping helper `mapAsyncIter`:
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
 * and you rather have the formatting logic right at the place in code of passing the prop instead
 * of far from it, having to perform the transformation using some `useMemo` call at the top of the
 * component.
 *
 * The utility's method of operation is it will take `source` and return from it a new transformed
 * async iterable object, attaching it with some special metadata that tells library tools like
 * {@link Iterate `<Iterate>`} and {@link useAsyncIter `useAsyncIter`} to bind the iteration process
 * to the same original base object. This way, the outer "formatted" iterable may be recreated repeatedly
 * without concerns of restarting the iteration process (as long as the `source` arg is consistently
 * passed the same base object).
 *
 * `source` may have a current value property (at `.value.current` - per the `AsyncIterableSubject`
 * interface), in which case it will be formatted via `formatFn` in the same way like yielded values.
 *
 * If `source` is a plain value and not an async iterable, it will be passed to the given `formatFn`
 * and returned on the spot.
 *
 * @template TIn The full type of the source input.
 * @template TRes The type of values resulting after formatting.
 *
 * @param source Any async iterable or plain value.
 * @param formatFn Function that performs formatting/mapping logic for each value of `source`
 *
 * @returns a transformed async iterable emitting every value of `source` after formatting.
 */
function iterateFormatted<TIn, TRes>(
  source: TIn,
  formatFn: (
    value: ExtractAsyncIterValue<TIn> | (TIn extends AsyncIterableSubject<infer J> ? J : never),
    i: number
  ) => TRes
): ReactAsyncIterable<ExtractAsyncIterValue<TIn>, TRes> &
  (TIn extends AsyncIterableSubject<unknown>
    ? { value: AsyncIterableSubject<TRes>['value'] }
    : { value: undefined });

function iterateFormatted(
  source:
    | undefined
    | null
    | {
        [Symbol.asyncIterator]?: () => AsyncIterator<unknown, unknown, unknown>;
        [reactAsyncIterSpecialInfoSymbol]?: ReactAsyncIterSpecialInfo<unknown, unknown>;
        value?: AsyncIterableSubject<unknown>['value'];
      },
  formatFn: (value: unknown, i: number) => unknown
): unknown {
  if (!isAsyncIter(source)) {
    return formatFn(source, 0);
  }

  const sourcePrevSpecialInfo = source[reactAsyncIterSpecialInfoSymbol];

  return {
    [Symbol.asyncIterator]: () => asyncIterSyncMap(source, formatFn)[Symbol.asyncIterator](),

    ...(!sourcePrevSpecialInfo
      ? {
          value: !source.value
            ? undefined
            : {
                current: formatFn(source.value.current, 0),
              },

          [reactAsyncIterSpecialInfoSymbol]: {
            origSource: source,
            formatFn,
          },
        }
      : {
          value: !source.value
            ? undefined
            : {
                current: (() => {
                  const prevMapResult = sourcePrevSpecialInfo.formatFn(source.value.current, 0);
                  return formatFn(prevMapResult, 0);
                })(),
              },

          [reactAsyncIterSpecialInfoSymbol]: {
            origSource: sourcePrevSpecialInfo.origSource,
            formatFn: (value: unknown, i: number) => {
              const prevMapResult = sourcePrevSpecialInfo.formatFn(value, i);
              return formatFn(prevMapResult, i);
            },
          },
        }),
  };
}
