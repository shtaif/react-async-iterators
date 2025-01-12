import { useEffect } from 'react';
import { callOrReturn } from '../common/callOrReturn.js';
import { useRefWithInitialValue } from '../common/hooks/useRefWithInitialValue.js';
import { type MaybeFunction } from '../common/MaybeFunction.js';
import { type Iterate } from '../Iterate/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { AsyncIterableChannel, type AsyncIterableSubject } from '../common/AsyncIterableChannel.js';

export { useAsyncIterState, type AsyncIterStateResult, type AsyncIterableSubject };

/**
 * Basically like {@link https://react.dev/reference/react/useState `React.useState`}, only that the value
 * is provided back __wrapped as an async iterable__.
 *
 * This hook allows a component to declare and manage a piece of state while easily letting you control
 * what specifically area(s) within the UI should be bound to it (should re-render in reaction to changes
 * in it) - for example, if combined with one or more {@link Iterate `<Iterate>`}s.
 *
 * @example
 * ```tsx
 * // Quick usage:
 *
 * import { useAsyncIterState, Iterate } from 'async-react-iterators';
 *
 * function MyForm() {
 *   const [firstNameIter, setFirstName] = useAsyncIterState<string>();
 *   const [lastNameIter, setLastName] = useAsyncIterState<string>();
 *   return (
 *     <div>
 *       <form>
 *         <FirstNameInput valueIter={firstNameIter} onChange={setFirstName} />
 *         <LastNameInput valueIter={lastNameIter} onChange={setLastName} />
 *       </form>
 *
 *       Greetings, <Iterate>{firstNameIter}</Iterate> <Iterate>{lastNameIter}</Iterate>
 *     </div>
 *   );
 * }
 * ```
 *
 * ---
 *
 * The returned async iterable can be passed over to any level down the component tree and rendered
 * using `<Iterate>`, `useAsyncIter`, and so on. It also contains a `.current.value` property which shows
 * the current up to date state value at all times. Use this any case you just need to read the immediate
 * current state rather than directly rendering it, since for rendering you may simply async-iterate it.
 *
 * Returned also alongside the async iterable is a function for updating the state. Calling it with a new
 * value will cause the paired iterable to yield the updated state value as well as immediately set the
 * iterable's `.current.value` property to that new state. Just like
 * [`React.useState`'s setter](https://react.dev/reference/react/useState#setstate), you can pass it
 * the next state directly, or a function that calculates it from the previous state.
 *
 * Unlike vanila `React.useState`, which simply re-renders the entire component - `useAsyncIterState`
 * helps confine UI updates by handing you an iterable which choose how and where in the component tree
 * to render it. This work method can facilitate layers of sub-components that pass actual async iterables
 * across one another as props, skipping typical cascading re-renderings down to __only the inner-most
 * leafs__ of the UI tree.
 *
 * @example
 * ```tsx
 * // Use the state iterable's `.current.value` property to read the immediate current state:
 *
 * import { useAsyncIterState } from 'async-react-iterators';
 *
 * function MyForm() {
 *   const [firstNameIter, setFirstName] = useAsyncIterState<string>();
 *   const [lastNameIter, setLastName] = useAsyncIterState<string>();
 *
 *   return (
 *     <form
 *       onSubmit={() => {
 *         const firstName = firstNameIter.current.value;
 *         const lastName = lastNameIter.current.value;
 *         // submit `firstName` and `lastName`...
 *       }}
 *     >
 *       <>...</>
 *     </form>
 *   );
 * }
 * ```
 *
 * The returned async iterable is a shared iterable - can be iterated by multiple consumers simultaneously
 * (e.g multiple {@link Iterate `<Iterate>`}s) and each would pick up the same yielded values and at the
 * same time.
 *
 * The returned async iterable is automatically closed on host component unmount.
 *
 * ---
 *
 * @template TVal the type of state to be set and yielded by returned iterable.
 * @template TInitVal The type of the starting value for the state iterable's `.current.value` property.
 *
 * @param initialValue Any optional starting value for the state iterable's `.current.value` property, defaults to `undefined`. You can pass an actual value, or a function that returns a value (which the hook will call once during mounting).
 *
 * @returns a stateful async iterable and a function with which to yield an update, both maintain stable references across re-renders.
 *
 * @see {@link Iterate `<Iterate>`}
 */
function useAsyncIterState<TVal>(): AsyncIterStateResult<TVal, undefined>;

function useAsyncIterState<TVal>(
  initialValue: MaybeFunction<TVal>
): AsyncIterStateResult<TVal, TVal>;

function useAsyncIterState<TVal, TInitVal = undefined>(
  initialValue: MaybeFunction<TInitVal>
): AsyncIterStateResult<TVal, TInitVal>;

function useAsyncIterState<TVal, TInitVal>(
  initialValue?: MaybeFunction<TInitVal>
): AsyncIterStateResult<TVal, TInitVal> {
  const ref = useRefWithInitialValue<{
    channel: AsyncIterableChannel<TVal, TInitVal>;
    result: AsyncIterStateResult<TVal, TInitVal>;
  }>(() => {
    const initialValueCalced = callOrReturn(initialValue) as TInitVal;
    const channel = new AsyncIterableChannel<TVal, TInitVal>(initialValueCalced);
    return {
      channel,
      result: [channel.out, newVal => channel.put(newVal)],
    };
  });

  const { channel, result } = ref.current;

  useEffect(() => {
    return () => channel.close();
  }, []);

  return result;
}

/**
 * A pair of stateful async iterable and a function which updates the state and making the paired
 * async iterable yield the new value.
 * Returned from the {@link useAsyncIterState `useAsyncIterState`} hook.
 *
 * @see {@link useAsyncIterState `useAsyncIterState`}
 */
type AsyncIterStateResult<TVal, TInitVal> = [
  /**
   * A stateful async iterable which yields every updated value following a state update.
   *
   * Includes a `.current.value` property which shows the current up to date state value at all times.
   *
   * This is a shared async iterable - all iterators obtained from it share the same source values,
   * meaning multiple iterators can be consumed (iterated) simultaneously, each one picking up the
   * same values as others the moment they were generated through state updates.
   */
  values: AsyncIterableSubject<TVal, TInitVal>,

  /**
   * A function which updates the state, causing the paired async iterable to yield the updated state
   * value and immediately sets its `.current.value` property to the latest state.
   */
  setValue: (update: TVal | ((prevState: TVal | TInitVal) => TVal)) => void,
];
