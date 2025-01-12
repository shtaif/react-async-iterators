import { useMemo, useEffect } from 'react';
import { useLatest } from '../common/hooks/useLatest.js';
import { isAsyncIter } from '../common/isAsyncIter.js';
import { useSimpleRerender } from '../common/hooks/useSimpleRerender.js';
import { useRefWithInitialValue } from '../common/hooks/useRefWithInitialValue.js';
import { type MaybeFunction } from '../common/MaybeFunction.js';
import { type AsyncIterableSubject } from '../AsyncIterableSubject/index.js';
import {
  reactAsyncIterSpecialInfoSymbol,
  type ReactAsyncIterSpecialInfo,
} from '../common/ReactAsyncIterable.js';
import { iterateAsyncIterWithCallbacks } from '../common/iterateAsyncIterWithCallbacks.js';
import { callOrReturn } from '../common/callOrReturn.js';
import { type Iterate } from '../Iterate/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { type iterateFormatted } from '../iterateFormatted/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars

export { useAsyncIter, type IterationResult };

/**
 * `useAsyncIter` hooks up a single async iterable value to your component and its lifecycle.
 *
 * @example
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
 * ---
 *
 * Given an async iterable `input`, this hook will iterate it value-by-value and update (re-render) the
 * host component upon each yielded value, along with any possible completion or error it may run into.
 * `input` may also be given a plain (non async iterable) value, in which case it will simply be used
 * to render once and immediately, thus enabling components that can handle _"static"_ as well as
 * _"changing"_ values and props seamlessly.
 *
 * The hook initializes and maintains its iteration process with its given async iterable `input`
 * across component updates as long as `input` keeps getting passed the same object reference every
 * time (similar to the behavior of a `useEffect(() => {...}, [input])`), therefore care should be taken
 * to avoid constantly recreating the iterable on every render, by e.g; declaring it outside the component
 * body, control __when__ it should be recreated with React's
 * [`useMemo`](https://react.dev/reference/react/useMemo) or alternatively use the library's
 * {@link iterateFormatted `iterateFormatted`} util for a formatted version of an iterable which
 * preserves its identity.
 * Whenever `useAsyncIter` detects a different `input` value, it automatically closes the previous
 * active async iterable and proceeds to start iteration with the new `input` async iterable. On
 * component unmount, the hook will also ensure closing any currently iterated `input`.
 *
 * The object returned from `useAsyncIter` holds all the state from the most recent iteration
 * of `input` (most recent value, whether is completed or still running, etc. - see
 * {@link IterationResult `IterationResult`}).
 * In case `input` is given a plain value, it will be delivered as-is within the returned
 * result object's `value` property.
 * 
 * ---
 *
 * @template TVal The type of values yielded by the passed iterable or type of plain value if otherwise passed.
 * @template TInitVal The type of the initial value, defaults to `undefined`.
 *
 * @param input Any async iterable or plain value.
 * @param initialVal Any optional starting value for the hook to return prior to the ___first yield___ of the ___first given___ async iterable, defaults to `undefined`. You can pass an actual value, or a function that returns a value (which the hook will call once during mounting).
 *
 * @returns An object with properties reflecting the current state of the iterated async iterable or plain value provided via `input` (see {@link IterationResult `IterationResult`}).
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
  <TVal, TInitVal>(
    input: TVal,
    initialVal: MaybeFunction<TInitVal>
  ): IterationResult<TVal, TInitVal>;
} = (
  input:
    | undefined
    | null
    | {
        [Symbol.asyncIterator]?: () => AsyncIterator<unknown, unknown, unknown>;
        [reactAsyncIterSpecialInfoSymbol]?: ReactAsyncIterSpecialInfo<unknown, unknown>;
        value?: AsyncIterableSubject<unknown>['value'];
      },
  initialVal: MaybeFunction<unknown>
): IterationResult<unknown, unknown> => {
  const rerender = useSimpleRerender();

  const stateRef = useRefWithInitialValue<IterationResult<unknown, unknown>>(() => ({
    value: callOrReturn(initialVal) /*as any*/,
    pendingFirst: true,
    done: false,
    error: undefined,
  }));

  const latestInputRef = useLatest(input);

  if (!isAsyncIter(latestInputRef.current)) {
    useMemo(() => {}, [undefined]);
    useEffect(() => {}, [undefined]);

    stateRef.current = {
      value: latestInputRef.current /*as unknown*/,
      pendingFirst: false,
      done: false,
      error: undefined,
    };

    return stateRef.current;
  } else {
    const iterSourceRefToUse =
      latestInputRef.current[reactAsyncIterSpecialInfoSymbol]?.origSource ?? latestInputRef.current;

    useMemo((): void => {
      const latestInputRefCurrent = latestInputRef.current!;

      let value;
      let pendingFirst;

      if (latestInputRefCurrent.value) {
        value = latestInputRefCurrent.value.current;
        pendingFirst = false;
      } else {
        const prevSourceLastestVal = stateRef.current.value;
        value = prevSourceLastestVal;
        pendingFirst = true;
      }

      stateRef.current = {
        value,
        pendingFirst,
        done: false,
        error: undefined,
      };
    }, [iterSourceRefToUse]);

    useEffect(() => {
      let iterationIdx = 0;

      return iterateAsyncIterWithCallbacks(iterSourceRefToUse, stateRef.current.value, next => {
        const possibleGivenFormatFn =
          latestInputRef.current?.[reactAsyncIterSpecialInfoSymbol]?.formatFn;

        const formattedValue = possibleGivenFormatFn
          ? possibleGivenFormatFn(next.value, iterationIdx++)
          : next.value; /*as unknown*/

        stateRef.current = {
          ...next,
          pendingFirst: false,
          value: formattedValue,
        };

        rerender();
      });
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
  value: TVal extends AsyncIterableSubject<infer J>
    ? J
    : TVal extends AsyncIterable<infer J>
      ? J | TInitVal
      : TVal;

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
  | (TVal extends AsyncIterableSubject<unknown>
      ? never
      : {
          pendingFirst: true;
          done: false;
          error: undefined;
        })
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

type ___1 = { a: string } & never;
