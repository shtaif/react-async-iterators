import { type ReactNode } from 'react';
import { type Writeable } from '../common/Writeable.js';
import { useAsyncIterMulti, type IterationResultSet } from '../useAsyncIterMulti/index.js';
import { type iterateFormatted } from '../iterateFormatted/index.js'; // eslint-disable-line @typescript-eslint/no-unused-vars

export { IterateMulti, type IterateMultiProps };

// TODO: The initial values should be able to be given in function/s form, with consideration for iterable sources that could be added in dynamically.

/**
 * The `<IterateMulti>` helper component (also exported as `<ItMulti>`) is used to combine and render
 * any number of async iterables (or plain non-iterable values) directly onto a piece of UI.
 *
 * It's similar to `<Iterate>`, only it works with any changeable number of async iterables or plain values
 * instead of a single one. Essentially, can be seen as a {@link useAsyncIterMulti `useAsyncIterMulti`}
 * hook in a component form, conveniently.
 *
 * ---
 *
 * _Illustration:_
 *
 * @example
 * ```tsx
 * import { useMemo } from 'react';
 * import { ItMulti } from 'react-async-iterators';
 *
 * function MyComponent() {
 *   const numberIter = useMemo(() => createNumberIter(), []);
 *   const arrayIter = useMemo(() => createArrayIter(), []);
 *   return (
 *     <main>
 *       <Header />
 *       <SideMenu />
 *       <ItMulti values={[numberIter, arrayIter]} initialValues={[0, []]}>
 *         {([numState, arrState]) => (
 *           <>
 *             <div>
 *               {numState.pendingFirst
 *                 ? '⏳ Loading number...'
 *                 : `Current number: ${numState.value}`}
 *             </div>
 *             <div>
 *               {arrState.pendingFirst
 *                 ? '⏳ Loading items...'
 *                 : arrState.value.map((item, i) => <div key={i}>{item}</div>)}
 *             </div>
 *           </>
 *         )}
 *       </ItMulti>
 *     </main>
 *   )
 * }
 * ```
 *
 * `<IterateMulti>` may be preferable over the {@link useAsyncIterMulti `useAsyncIterMulti`} counterpart
 * typically as the UI area it re-renders within a component tree can be expressly confined to the
 * necessary minimum, saving any other unrelated elements from re-evaluation - while on the other hand,
 * {@link useAsyncIterMulti `useAsyncIterMulti`} being a hook it has to re-render an entire component's
 * output for every new value.
 *
 * Given an array of source async iterables (or plain values) as the `values` prop, this hook will start
 * iterating each of them concurrently, re-rendering every time any source yields a value, completes, or
 * errors outs. This will run the render function provided as children to `<IterateMulti>` with an array
 * argument that includes all latest individual states of current sources.
 *
 * `values` may also be mixed with plain (non async iterable) values, in which case they'll simply be
 * returned as-are, coinciding along current values of other async iterables.
 * This can enable components that can work seamlessly with either _"static"_ and _"changing"_ values
 * and props.
 *
 * Semantics are similar with `<Iterate>` - the component maintains its iteration process with each async
 * iterable object as long as that same object remains present in the arrays passed to the `values` prop
 * across subsequent updates. Changing the position of such object in the array on a consequent call will
 * __not__ close its current running iteration - it will only change the position its result appears at
 * in the array argument passed into the render function.
 * Care should be taken therefore to not unintentionally recreate the given iterables on every render,
 * by e.g; declaring an iterable outside the component body, controling __when__ it should be recreated
 * with React's [`useMemo`](https://react.dev/reference/react/useMemo) or preferably use the library's
 * {@link iterateFormatted `iterateFormatted`} util for formatting an iterable's values while preserving
 * its identity.
 *
 * Whenever `<IterateMulti>` is updated with a new inputs array and detects that one or more async
 * iterables from the previously given array are no longer present, it will close their iteration
 * processes. On component unmount, the hook will ensure closing all active iterated async iterables
 * entirely.
 *
 * ---
 *
 * @template TVals The type of the input set of async iterable or plain values as an array/tuple.
 * @template TInitVals The type of initial values for each of the input values as an array/tuple, corresponding by order. For input values which don't have a corrsponding initial value, the default is `undefined`.
 *
 * @param props Props for `<IterateMulti>`. See {@link IterateMultiProps `IterateMultiProps`}.
 *
 * @returns A React node that re-renders itself whenever any of the source inputs change's state, and formatted by the child render function passed into `children`.
 *
 * @see {@link IterationResultSet `IterationResultSet`}
 *
 * @example
 * ```tsx
 * // Using `<ItMulti>` with a dynamically-changed amount of inputs:
 *
 * import { useState } from 'react';
 * import { ItMulti, type MaybeAsyncIterable } from 'react-async-iterators';
 *
 * function DynamicInputsComponent() {
 *   const [inputs, setInputs] = useState<MaybeAsyncIterable<string>[]>([]);
 *
 *   const addAsyncIterValue = () => {
 *     const iterableValue = (async function* () {
 *       for (let i = 0; i < 10; i++) {
 *         await new Promise(resolve => setTimeout(resolve, 500));
 *         yield `Item ${i}`;
 *       }
 *     })();
 *     setInputs(prev => [...prev, iterableValue]);
 *   };
 *
 *   const addStaticValue = () => {
 *     const staticValue = `Static ${inputs.length + 1}`;
 *     setInputs(prev => [...prev, staticValue]);
 *   };
 *
 *   return (
 *     <div>
 *       <h3>Dynamic Concurrent Async Iteration</h3>
 *
 *       <button onClick={addAsyncIterValue}>🔄 Add Async Iterable</button>
 *       <button onClick={addStaticValue}>🗿 Add Static Value</button>
 *
 *       <ul>
 *         <ItMulti values={inputs}>
 *           {states =>
 *             states.map((state, i) => (
 *               <li key={i}>
 *                 {state.done
 *                   ? state.error
 *                     ? `Error: ${state.error}`
 *                     : 'Done'
 *                   : state.pendingFirst
 *                     ? 'Pending...'
 *                     : `Value: ${state.value}`}
 *               </li>
 *             ))
 *           }
 *         </ItMulti>
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
function IterateMulti<
  const TVals extends readonly unknown[],
  const TInitVals extends readonly unknown[] = undefined[],
>(props: IterateMultiProps<TVals, TInitVals>): ReactNode {
  const nexts = useAsyncIterMulti(props.values, {
    initialValues: props.initialValues,
  });
  return props.children(nexts);
}

/**
 * Props for the {@link IterateMulti `<IterateMulti>`} component.
 *
 * @template TVals The type of the input set of async iterable or plain values as an array/tuple.
 * @template TInitVals The type of initial values for each of the input values as an array/tuple, corresponding by order. For input values which don't have a corrsponding initial value, the default is `undefined`.
 */
type IterateMultiProps<
  TVals extends readonly unknown[],
  TInitVals extends readonly unknown[] = readonly undefined[],
> = {
  /**
   * An array of values to iterate over simultaneously, which may include any mix of async iterables or
   * plain (non async iterable) values.
   */
  values: TVals;
  /**
   * An optional array of initial values, defaults to `undefined`. Each value here will be the starting
   * point for each of the async iterables on `values` (by corresponding array position) when it is
   * rendered by the `children` render function for the first time and while it's pending its first
   * yielded value.
   */
  initialValues?: TInitVals;
  /**
   * A render function that is called on every progression in of any of the running iterations, returning
   * something to render for them.
   *
   * @param iterationStates - An array of the combined iteration state objects of all sources given with the `values` prop, which includes each source's last yielded value, whether completed, any associated error, etc. Each object is corresponding to the source on the `values` array in the same the position (array index). (see {@link IterationResultSet `IterationResultSet`}).
   * @returns The content to render for the current iteration state.
   *
   * @see {@link IterateMultiProps `IterateMultiProps`}
   * @see {@link IterationResultSet `IterationResultSet`}
   */
  children: (
    iterationStates: IterationResultSet<Writeable<TVals>, Writeable<TInitVals>>
  ) => ReactNode;
};
