import { useRef, useMemo, useEffect } from 'react';
import { useLatest } from '../common/hooks/useLatest.js';
import { isAsyncIter } from '../common/isAsyncIter.js';
import { useSimpleRerender } from '../common/hooks/useSimpleRerender.js';
import { type ExtractAsyncIterValue } from '../common/ExtractAsyncIterValue.js';

export { useAsyncIter, type IterationResult };

// TODO: The initial value can be given as a function, which the internal `useState` would invoke as it's defined to do. So the typings should take into account it possibly being a function and if that's the case then to extract its return type instead of using the function type itself

/**
 * `useAsyncIter` hooks up a single async iterable value into your component and its lifecycle.
 *
 * Given an async iterable `input`, this hook will iterate it and rerender the host component upon
 * each new value that becomes available as well as any possible completion or error it may run into.
 * If `input` is a plain (non async iterable) value, it will simply be used to render once and
 * immediately.
 *
 * The hook inits and maintains its current iteration process across renderings as long as its
 * `input` is passed the same object reference each time (similar to the behavior of a
 * `useEffect(() => {...}, [input])`), therefore care should be taken to avoid constantly recreating
 * the iterable every render, e.g; declaring it outside the component body or control __when__ it
 * should be recreated with React's [`useMemo`](https://react.dev/reference/react/useMemo).
 * Whenever `useAsyncIter` detects a different `input` value, it automatically closes a previous
 * `input` async iterable before proceeding to iterate any new `input` async iterable. The hook will
 * also ensure closing a currently iterated `input` on component unmount.
 *
 * The object returned from `useAsyncIter` holds all the state from the most recent iteration
 * of `input` (most recent value, whether is completed or still running, etc. - see
 * {@link IterationResult}).
 * In case `input` is given a plain value, it will be delivered as-is within the returned
 * result object's `value` property.
 *
 * @param input Any async iterable or plain value
 * @param initialValue Any initial value for the hook to return prior to resolving the  ___first
 * emission___ of the ___first given___ async iterable, defaults to `undefined`.
 *
 * @returns An object with properties reflecting the current state of the iterated async iterable
 * or plain value provided via `input` (see {@link IterationResult})
 *
 * @see {@link IterationResult}
 *
 * @example
 * ```tsx
 * // In its simplest:
 *
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
 * @example
 * ```tsx
 * // With an `initialValue` and showing usage of all properties of the returned iteration object:
 *
 * import { useAsyncIter } from 'react-async-iterators';
 *
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
  <TValue>(
    input: AsyncIterable<TValue>,
    initialValue?: undefined
  ): IterationResult<TValue, undefined>;

  <TValue, TInitValue = undefined>(
    input: TValue,
    initialValue?: TInitValue
  ): IterationResult<TValue, TInitValue>;
} = <TValue, TInitValue = undefined>(
  input: TValue,
  initialValue: TInitValue
): IterationResult<TValue, TInitValue> => {
  const rerender = useSimpleRerender();

  const stateRef = useRef<IterationResult<TValue, TInitValue>>({
    value: initialValue,
    pendingFirst: true,
    done: false,
    error: undefined,
  });

  const latestInputRef = useLatest(input);

  if (!isAsyncIter(latestInputRef.current)) {
    useMemo(() => {}, [undefined]);
    useEffect(() => {}, [undefined]);

    return (stateRef.current = {
      value: latestInputRef.current as ExtractAsyncIterValue<TValue>,
      pendingFirst: false,
      done: false,
      error: undefined,
    });
  } else {
    useMemo(() => {
      stateRef.current = {
        value: stateRef.current.value,
        pendingFirst: true,
        done: false,
        error: undefined,
      };
    }, [latestInputRef.current]);

    useEffect(() => {
      const iterator = (latestInputRef.current as AsyncIterable<ExtractAsyncIterValue<TValue>>)[
        Symbol.asyncIterator
      ]();
      let iteratorClosedAbruptly = false;

      (async () => {
        try {
          for await (const value of { [Symbol.asyncIterator]: () => iterator }) {
            if (!iteratorClosedAbruptly) {
              stateRef.current = {
                value,
                pendingFirst: false,
                done: false,
                error: undefined,
              };
              rerender();
            }
          }
          if (!iteratorClosedAbruptly) {
            stateRef.current = {
              value: stateRef.current.value,
              pendingFirst: false,
              done: true,
              error: undefined,
            };
            rerender();
          }
        } catch (err) {
          if (!iteratorClosedAbruptly) {
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
        iteratorClosedAbruptly = true;
        iterator.return?.();
      };
    }, [latestInputRef.current]);

    return stateRef.current;
  }
};

/**
 * The `iterationResult` object holds all the state from the most recent iteration of a currently
 * hooked async iterable object (or plain value).
 *
 * Returned from the {@link useAsyncIter} hook and also injected into `<Iterate>` component's render function.
 *
 * @see {@link useAsyncIter}
 * @see {@link Iterate}
 */
type IterationResult<TVal, TInitVal = undefined> = {
  /**
   * The most recent value received from iterating an async iterable, starting as {@link TInitVal}.
   * If iterating a plain value, it will simply be it.
   *
   * Starting to iterate a new async iterable at any future point on itself doesn't reset this;
   * only some newly resolved next value will.
   * */
  value: ExtractAsyncIterValue<TVal> | TInitVal;

  /**
   * Indicates whether the iterated async iterable is still pending on its own first
   * value to be resolved.
   * Will appear `false` for any iterations thereafter and reset back every time the iteratee
   * is replaced with a new one.
   *
   * Can be used in certain cases for displaying _"loading" states_ metaphorically similar to
   * a how a pending state of a promise is thought of.
   *
   * Is always `false` for any plain value given instead of an async iterable.
   */
  pendingFirst: boolean;

  /**
   * Indicates whether the iterated async iterable is done; meaning had either completed (by
   * resolving a `{ done: true }` object
   * [MDN docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#done))
   * or threw an error (in which case the escorting `error` property will be set to it).
   *
   * When `true`, the adjacent `value` property will __still be set__ to the last value seen
   * until the moment of completing/erroring.
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
