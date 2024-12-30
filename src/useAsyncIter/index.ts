import { useRef, useMemo, useEffect } from 'react';
import { useLatest } from '../common/hooks/useLatest.js';
import { isAsyncIter } from '../common/isAsyncIter.js';
import { useSimpleRerender } from '../common/hooks/useSimpleRerender.js';
import { type ExtractAsyncIterValue } from '../common/ExtractAsyncIterValue.js';
import {
  reactAsyncIterSpecialInfoSymbol,
  type ReactAsyncIterSpecialInfo,
} from '../common/reactAsyncIterSpecialInfoSymbol.js';
import { type Iterate } from '../Iterate/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { type iterateFormatted } from '../iterateFormatted/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars

export { useAsyncIter, type IterationResult };

// TODO: The initial value can be given as a function, which the internal `useState` would invoke as it's defined to do. So the typings should take into account it possibly being a function and if that's the case then to extract its return type instead of using the function type itself

/**
 * `useAsyncIter` hooks up a single async iterable value into your component and its lifecycle.
 *
 * _Illustration:_
 *
 * ```tsx
 * import { useAsyncIter } from 'react-async-iterators';
 *
 * function SelfUpdatingTodoList(props) {
 *   const { value: todos } = useAsyncIter(props.todosAsyncIter);
 *   return (
 *     <ul>
 *       {todos?.map(todo => (
 *         <li key={todo.id}>{todo.text}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 *
 * Given an async iterable `input`, this hook will iterate it and rerender the host component upon
 * each new value that becomes available together with any possible completion or error it may run into.
 * If `input` is a plain (non async iterable) value, it will simply be used to render once and
 * immediately.
 *
 * The hook inits and maintains its current iteration process with its given `input` async iterable
 * across re-renders as long as `input` is passed the same object reference each time (similar to
 * the behavior of a `useEffect(() => {...}, [input])`), therefore care should be taken to avoid
 * constantly recreating the iterable every render, e.g; by declaring it outside the component body,
 * control __when__ it should be recreated with React's
 * [`useMemo`](https://react.dev/reference/react/useMemo) or alternatively the library's
 * {@link iterateFormatted `iterateFormatted`} util for only formatting the values.
 * Whenever `useAsyncIter` detects a different `input` value, it automatically closes a previous
 * `input` async iterable before proceeding to iterate any new `input` async iterable. The hook will
 * also ensure closing a currently iterated `input` on component unmount.
 *
 * The object returned from `useAsyncIter` holds all the state from the most recent iteration
 * of `input` (most recent value, whether is completed or still running, etc. - see
 * {@link IterationResult `IterationResult`}).
 * In case `input` is given a plain value, it will be delivered as-is within the returned
 * result object's `value` property.
 *
 * @template TVal The type of values yielded by the passed iterable or of a plain value passed otherwise.
 * @template TInitVal The type of the initial value, defaults to `undefined`.
 *
 * @param input Any async iterable or plain value
 * @param initialVal Any initial value for the hook to return prior to resolving the ___first
 * emission___ of the ___first given___ async iterable, defaults to `undefined`.
 *
 * @returns An object with properties reflecting the current state of the iterated async iterable
 * or plain value provided via `input` (see {@link IterationResult `IterationResult`})
 *
 * @see {@link IterationResult `IterationResult`}
 *
 * @example
 * ```tsx
 * // With an `initialVal` and showing usage of all properties of the returned iteration object:
 *
 * import { useAsyncIter } from 'react-async-iterators';

 * function SelfUpdatingTodoList(props) {
 *   const todosNext = useAsyncIter(props.todosAsyncIter, []);
 *   return (
 *     <>
 *       {todosNext.error ? (
 *         <div>An error was encountered: {todosNext.error.toString()}</div>
 *       ) : todosNext.done && (
 *         <div>No additional updates for todos are expected</div>
 *       )}
 *
 *       {todosNext.pendingFirst ? (
 *         <div>Loading first todos...</div>
 *       ) : (
 *         <ul>
 *           {todosNext.map(todo => (
 *             <li key={todo.id}>{todo.text}</li>
 *           ))}
 *         </ul>
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
const useAsyncIter: {
  <TVal>(input: TVal, initialVal?: undefined): IterationResult<TVal>;
  <TVal, TInitVal>(input: TVal, initialVal: TInitVal): IterationResult<TVal, TInitVal>;
} = <
  TVal extends
    | undefined
    | null
    | {
        [Symbol.asyncIterator]?: () => AsyncIterator<ExtractAsyncIterValue<TVal>, unknown, unknown>;
        [reactAsyncIterSpecialInfoSymbol]?: ReactAsyncIterSpecialInfo<
          unknown,
          ExtractAsyncIterValue<TVal>
        >;
      },
  TInitVal = undefined,
>(
  input: TVal,
  initialVal: TInitVal
): IterationResult<TVal, TInitVal> => {
  const rerender = useSimpleRerender();

  const stateRef = useRef<IterationResult<TVal, TInitVal>>({
    value: initialVal as any,
    pendingFirst: true,
    done: false,
    error: undefined,
  });

  const latestInputRef = useLatest(input);

  if (!isAsyncIter(latestInputRef.current)) {
    useMemo(() => {}, [undefined]);
    useEffect(() => {}, [undefined]);

    stateRef.current = {
      value: latestInputRef.current as ExtractAsyncIterValue<TVal>,
      pendingFirst: false,
      done: false,
      error: undefined,
    };

    return stateRef.current;
  } else {
    const iterSourceRefToUse =
      latestInputRef.current[reactAsyncIterSpecialInfoSymbol]?.origSource ?? latestInputRef.current;

    useMemo((): void => {
      stateRef.current = {
        value: stateRef.current.value,
        pendingFirst: true,
        done: false,
        error: undefined,
      };
    }, [iterSourceRefToUse]);

    useEffect(() => {
      const iterator = iterSourceRefToUse[Symbol.asyncIterator]();
      let iteratorClosedByConsumer = false;

      (async () => {
        let iterationIdx = 0;

        try {
          for await (const value of { [Symbol.asyncIterator]: () => iterator }) {
            if (!iteratorClosedByConsumer) {
              const formattedValue =
                latestInputRef.current?.[reactAsyncIterSpecialInfoSymbol]?.formatFn(
                  value,
                  iterationIdx++
                ) ?? (value as ExtractAsyncIterValue<TVal>);

              if (!Object.is(formattedValue, stateRef.current.value)) {
                stateRef.current = {
                  value: formattedValue,
                  pendingFirst: false,
                  done: false,
                  error: undefined,
                };
                rerender();
              }
            }
          }
          if (!iteratorClosedByConsumer) {
            stateRef.current = {
              value: stateRef.current.value,
              pendingFirst: false,
              done: true,
              error: undefined,
            };
            rerender();
          }
        } catch (err) {
          if (!iteratorClosedByConsumer) {
            stateRef.current = {
              value: stateRef.current.value,
              pendingFirst: false,
              done: true,
              error: err,
            };
            rerender();
          }
        }
      })();

      return () => {
        iteratorClosedByConsumer = true;
        iterator.return?.();
      };
    }, [iterSourceRefToUse]);

    return stateRef.current;
  }
};

/**
 * The `iterationResult` object holds all the state from the most recent iteration of a currently
 * hooked async iterable object (or plain value).
 *
 * Returned from the {@link useAsyncIter `useAsyncIter`} hook and also injected into
 * {@link Iterate `<Iterate>`} component's render function.
 *
 * @see {@link useAsyncIter `useAsyncIter`}
 * @see {@link Iterate `<Iterate>`}
 */
type IterationResult<TVal, TInitVal = undefined> = {
  /**
   * The most recent value received from the async iterable iteration, starting as {@link TInitVal}.
   * If the source was a plain value instead, it will simply be it, ignoring any {@link TInitVal}.
   *
   * When the source iterable changes and an iteration restarts with a new iterable, the same last
   * `value` is carried over and reflected until the new iterable resolves its first value.
   * */
  value: TVal extends AsyncIterable<infer J> ? J | TInitVal : TVal;

  /**
   * Indicates whether the iterated async iterable is still pending its own first value to be
   * resolved.
   * Will appear `false` for any iterations thereafter and reset back every time the iteratee
   * is changed to a new one.
   *
   * Can be used in certain cases for displaying _"loading" states_ metaphorically similar to
   * a how a pending state of a promise is thought of.
   *
   * Is always `false` for any plain value given instead of an async iterable.
   */
  pendingFirst: boolean;

  /**
   * Indicates whether the iterated async iterable has ended having no further values to yield,
   * meaning either of:
   * - it has completed (by resolving a `{ done: true }` object
   * ([MDN docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#done)))
   * - it had thrown an error (in which case the escorting `error` property will be set to
   * that error).
   *
   * When `true`, the adjacent `value` property will __still be set__ to the last value seen
   * before the moment of completing/erroring.
   *
   * Is always `false` for any plain value given instead of an async iterable.
   */
  done: boolean;

  /**
   * Indicates whether the iterated async iterable threw an error, capturing a reference to it.
   *
   * If `error` is non-empty, the escorting `done` property will always be `true` since the
   * iteration process is considered over.
   *
   * Is always `undefined` for any plain value given instead of an async iterable.
   */
  error: unknown;
} & (
  | {
      pendingFirst: true;
      done: false;
      error: undefined;
    }
  | ({
      pendingFirst: false;
    } & (
      | {
          done: false;
          error: undefined;
        }
      | {
          done: true;
          error: unknown;
        }
    ))
);
