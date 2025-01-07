import { type ReactNode } from 'react';
import { useAsyncIter, type IterationResult } from '../useAsyncIter/index.js';

export { Iterate, type IterateProps };

/**
 * The `<Iterate>` helper component (also exported as `<It>`) is used to format and render an async
 * iterable (or a plain non-iterable value) directly onto a piece of UI.
 *
 * Essentially, can be seen as a {@link useAsyncIter `useAsyncIter`} hook in a component form,
 * conveniently.
 *
 * _Illustration:_
 *
 * ```tsx
 * import { It } from 'react-async-iterators';
 *
 * function SelfUpdatingTodoList(props) {
 *   return (
 *     <div>
 *       <h2>My TODOs</h2>
 *
 *       <div>
 *         Last TODO was completed at: <It>{props.lastCompletedTodoDate}</It>
 *       </div>
 *
 *       <ul>
 *         <It value={props.todosAsyncIter}>
 *           {({ value: todos }) =>
 *             todos?.map(todo =>
 *               <li key={todo.id}>{todo.text}</li>
 *             )
 *           }
 *         </It>
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 *
 * `<Iterate>` may be preferable over the {@link useAsyncIter `useAsyncIter`} counterpart typically as
 * the UI area it re-renders within a component tree can be expressly confined to the necessary
 * minimum, saving any other unrelated elements from re-evaluation - while on the other hand
 * {@link useAsyncIter `useAsyncIter`} being a hook it has to re-render an entire
 * component's output for every new value.
 *
 * Given an async iterable as the `value` prop, this component will iterate it and render each new
 * value that becomes available together with any possible completion or error it may run into.
 * If `value` is a plain (non async iterable) value, it will simply be rendered over as-is.
 *
 * Whenever given `value` is changed from the previous one seen, `<Iterate>` will close the previous
 * if it was async iterable before proceeding to iterate the new `value`. Care should be taken to
 * avoid passing a constantly recreated iterable object across re-renders, e.g; by declaring it outside the component body or control __when__ it
 * should be recreated with React's [`useMemo`](https://react.dev/reference/react/useMemo).
 * `<Iterate>` will automatically close its iterated iterable as soon as it gets unmounted.
 *
 * ---
 *
 * @template TVal The type of values yielded by the passed iterable or otherwise type of the passed plain value itself.
 * @template TInitialVal The type of the initial value, defaults to `undefined`.
 *
 * @param props Props for `<Iterate>`. See {@link IterateProps `IterateProps`}.
 *
 * @returns A React node that re-renders itself with each yielded value, completion or error, and formatted by the child render function passed into `children` (or just the yielded value as-is in the absent of it).
 *
 * @see {@link IterationResult `IterationResult`}
 *
 * @example
 * ```tsx
 * // With the `initialValue` prop and showing usage of all properties of the iteration object
 * // within the child render function:
 *
 * import { Iterate } from 'react-async-iterators';
 *
 * function SelfUpdatingTodoList(props) {
 *   return (
 *     <div>
 *       <h2>My TODOs</h2>
 *
 *       <Iterate initialValue={[]} value={props.todosAsyncIter}>
 *         {todosNext =>
 *           todosNext.pendingFirst ? (
 *             <div>Loading first todos...</div>
 *           ) : (
 *             <>
 *               {todosNext.error ? (
 *                 <div>An error was encountered: {todosNext.error.toString()}</div>
 *               ) : (
 *                 todosNext.done && <div>No additional updates for todos are expected</div>
 *               )}
 *
 *               <ul>
 *                 {todosNext.map(todo => (
 *                   <li key={todo.id}>{todo.text}</li>
 *                 ))}
 *               </ul>
 *             </>
 *           )
 *         }
 *       </Iterate>
 *     </div>
 *   );
 * }
 * ```
 */
function Iterate<TVal, TInitialVal = undefined>(props: IterateProps<TVal, TInitialVal>): ReactNode {
  const renderOutput =
    typeof props.children === 'function'
      ? (() => {
          const propsBetterTyped = props as IteratePropsWithRenderFunction<TVal, TInitialVal>;
          const next = useAsyncIter(
            propsBetterTyped.value,
            propsBetterTyped.initialValue as TInitialVal
          );
          return propsBetterTyped.children(next);
        })()
      : (() => {
          const propsBetterTyped = props as IteratePropsWithNoRenderFunction;
          const next = useAsyncIter(propsBetterTyped.children, propsBetterTyped.initialValue);
          return next.value;
        })();

  return renderOutput;
}

/**
 * Props for the {@link Iterate `<Iterate>`} component.
 * The component accepts its props in two variants:
 *
 * 1. Providing a render function as `children` to dynamically format each state of the iteration.
 * 2. Providing an async iterable as `children` to render the values of the async iterable (or plain value) directly as are.
 *
 * @template TVal The type of the input async iterable or plain value.
 * @template TInitialVal The type of the initial value, defaults to `undefined`.
 */
type IterateProps<TVal, TInitialVal = undefined> =
  | IteratePropsWithRenderFunction<TVal, TInitialVal>
  | IteratePropsWithNoRenderFunction;

type IteratePropsWithRenderFunction<TVal, TInitialVal = undefined> = {
  /**
   * The source value to iterate over, an async iterable or a plain (non async iterable) value.
   */
  value: TVal;
  /**
   * An optional initial value, defaults to `undefined`. Will be the value provided inside the child
   * render function when `<Iterate>` first renders on being mounted and while it's pending its first
   * value to be yielded.
   */
  initialValue?: TInitialVal;
  /**
   * A render function that is called for each step of the iteration, returning something to render
   * out of it.
   *
   * @param nextIterationState - The current state of the iteration, including the yielded value, whether iteration is complete, any associated error, etc. (see {@link IterationResult `IterationResult`})
   * @returns The content to render for the current iteration state.
   *
   * @see {@link IterateProps `IterateProps`}
   * @see {@link IterationResult `IterationResult`}
   */
  children: (nextIterationState: IterationResult<TVal, TInitialVal>) => ReactNode;
};

type IteratePropsWithNoRenderFunction = {
  /**
   * The `value` prop source value should not be provided for this variant since it is already
   * passed via `children` (see {@link IterateProps `IterateProps`}).
   */
  value?: undefined;
  /**
   * An optional initial value, defaults to `undefined`.
   */
  initialValue?: ReactNode;
  /**
   * The source value to render from, either an async iterable to iterate over of a plain value.
   */
  children: ReactNode | AsyncIterable<ReactNode>;
};
