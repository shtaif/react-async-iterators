import { useEffect, useRef } from 'react';
import { IterableChannel, type AsyncIterableSubject } from './IterableChannel.js';
import { type Iterate } from '../Iterate/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars

export { useAsyncIterState, type AsyncIterStateResult, type AsyncIterableSubject };

/**
 * Basically like {@link https://react.dev/reference/react/useState `React.useState`}, only that the value
 * is provided back __wrapped as an async iterable__.
 *
 * This hook allows a component to declare and manage a piece of state while easily letting it control
 * what area(s) specifically within the UI should be bound to it (should re-render in reaction to changes
 * in it) - combined for example with one or more {@link Iterate `<Iterate>`}s.
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
 * This is unlike vanila `React.useState` which simply re-renders the entire component. Instead,
 * `useAsyncIterState` helps confine UI updates as well as facilitate layers of sub-components that pass
 * actual async iterables across one another as props, skipping typical cascading re-renderings down to
 * __only the inner-most leafs__ of the UI tree.
 *
 * The returned async iterable contains a `.current.value` property which shows the current up to date
 * state value at all times. Use this any case you just need to read the immediate current state rather
 * than directly rendering it, since for rendering you may simply async-iterate it.
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
 *
 * @returns a stateful async iterable and a function with which to yield an update, both maintain stable references across re-renders.
 *
 * @see {@link Iterate `<Iterate>`}
 */
function useAsyncIterState<TVal>(): AsyncIterStateResult<TVal> {
  const ref = useRef<{
    channel: IterableChannel<TVal>;
    result: AsyncIterStateResult<TVal>;
  }>();

  ref.current ??= (() => {
    const channel = new IterableChannel<TVal>();
    return {
      channel,
      result: [channel.values, newVal => channel.put(newVal)],
    };
  })();

  const { channel, result } = ref.current;

  useEffect(() => {
    return () => channel.close();
  }, []);

  return result;
}

/**
 * A pair of stateful async iterable and a function which modifies the state and yields the updated value.
 * Returned from the {@link useAsyncIterState `useAsyncIterState`} hook.
 *
 * @see {@link useAsyncIterState `useAsyncIterState`}
 */
type AsyncIterStateResult<TVal> = [
  /**
   * A stateful async iterable which yields every updated value following a state update.
   *
   * Includes a `.current.value` property which shows the current up to date state value at all times.
   *
   * This is a shared async iterable - all iterators obtained from it share the same source values,
   * meaning multiple iterators can be consumed (iterated) simultaneously, each one picking up the
   * same values as others the moment they were generated through state updates.
   */
  values: AsyncIterableSubject<TVal>,

  /**
   * A function which modifies the state, causing the paired async iterable to yield the updated state
   * value and immediately sets its `.current.value` property to the latest state.
   */
  setValue: (newValue: TVal) => void,
];
