import { useEffect, useRef } from 'react';
import { IterableChannel } from './IterableChannel.js';
import { type Iterate } from '../Iterate/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars

export { useAsyncIterState, type AsyncIterStateResult };

/**
 * Basically like {@link https://react.dev/reference/react/useState `React.useState`}, only that the value
 * is provided back __wrapped as an async iterable__.
 *
 * This hook allows a component to declare and manage a piece of state while easily letting it control
 * what area(s) specifically within the UI would be bound to it (will re-render in reaction to changes in it) -
 * combined for example with one or more {@link Iterate `<Iterate>`}s.
 *
 * ```tsx
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
 *   )
 * }
 * ```
 *
 * This is unlike vanila `React.useState` which simply re-renders the entire component. Instead,
 * `useAsyncIterState` helps confine UI updates as well as facilitate layers of sub-components that pass
 * actual async iterables across one another as props, skipping typical cascading re-renderings down to
 * __only the inner-most leafs__ of the UI tree.
 *
 * The returned async iterable is sharable; it can be iterated by multiple consumers concurrently
 * (e.g multiple {@link Iterate `<Iterate>`}s) all see the same yields at the same time.
 *
 * The returned async iterable is automatically closed on host component unmount.
 *
 * @template TVal the type of state to be set and yielded by returned iterable.
 *
 * @returns a stateful async iterable and a function with which to yield an update, both maintain stable
 * references across re-renders.
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
      result: [channel.iterable, newVal => channel.put(newVal)],
    };
  })();

  const { channel, result } = ref.current;

  useEffect(() => {
    return () => channel.close();
  }, []);

  return result;
}

/**
 * The pair of stateful async iterable and a function with which to yield an update.
 * Returned from the {@link useAsyncIterState `useAsyncIterState`} hook.
 *
 * @see {@link useAsyncIterState `useAsyncIterState`}
 */
type AsyncIterStateResult<TVal> = [IterableChannel<TVal>['iterable'], (newValue: TVal) => void];
