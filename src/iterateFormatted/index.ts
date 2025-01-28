import {
  reactAsyncIterSpecialInfoSymbol,
  parseReactAsyncIterable,
  type ReactAsyncIterable,
  type ReactAsyncIterSpecialInfo,
} from '../common/ReactAsyncIterable.js';
import { asyncIterSyncMap } from '../common/asyncIterSyncMap.js';
import { isAsyncIter } from '../common/isAsyncIter.js';
import { type DeasyncIterized } from '../common/DeasyncIterized.js';
import { type AsyncIterableSubject } from '../AsyncIterableSubject/index.js';
import { type useAsyncIter } from '../useAsyncIter/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { type Iterate } from '../Iterate/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars

export { iterateFormatted };

/**
 * A utility to inline-format an async iterable's values before passed into an other
 * consuming component.
 *
 * Can be thought of as mapping an async iterable before being rendered/passed over in the same way
 * you would commonly `.map(...)` an array before rendering/passing it over.
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
 * of having to perform the transformation using some `useMemo` call at the top of the component.
 *
 * The utility's method of operation is to be given a `source` and return from it a new transformed
 * async iterable object, attaching it with some special metadata that tells library tools like
 * {@link Iterate `<Iterate>`} and {@link useAsyncIter `useAsyncIter`} that the original base object
 * is what the iteration process should be bound to instead of the given object. This way, the
 * resulting formatted iterable may be recreated repeatedly without concerns of restarting the
 * iteration process (as long as `source` is passed the same base iterable consistently).
 *
 * `source` may have a current value property (at `.value.current` - per the `AsyncIterableSubject`
 * interface), in which case it will be formatted via `formatFn` in the same way like yielded values.
 *
 * If `source` is a plain value and not an async iterable, it will be passed into the given `formatFn`
 * and returned on the spot.
 *
 * @template TIn The full type of the source input.
 * @template TRes The type of values resulting after formatting.
 *
 * @param source Any async iterable or plain value.
 * @param formatFn Function that performs formatting/mapping logic for each value of `source`.
 *
 * @returns a transformed async iterable emitting every value of `source` after formatting.
 */
function iterateFormatted<TIn, TRes>(
  source: TIn,
  formatFn: (
    value: DeasyncIterized<TIn> | (TIn extends AsyncIterableSubject<infer J> ? J : never),
    i: number
  ) => TRes
): ReactAsyncIterable<DeasyncIterized<TIn>, TRes> &
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

  const { baseIter, formatFn: precedingFormatFn } = parseReactAsyncIterable(source);

  return {
    [Symbol.asyncIterator]: () => asyncIterSyncMap(source, formatFn)[Symbol.asyncIterator](),

    get value() {
      return !source.value
        ? undefined
        : {
            get current() {
              const result = precedingFormatFn(source.value!.current, 0);
              return formatFn(result, 0);
            },
          };
    },

    [reactAsyncIterSpecialInfoSymbol]: {
      origSource: baseIter,
      formatFn: (value: unknown, i: number) => {
        const result = precedingFormatFn(value, i);
        return formatFn(result, i);
      },
    },
  };
}
