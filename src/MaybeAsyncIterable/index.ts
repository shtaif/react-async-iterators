export { MaybeAsyncIterable };

/**
 * Helper type that represents either a plain value or an async iterable of that value.
 *
 * This type is useful among else for typing props for components that can accept either a
 * _"static" value_ or a _"changing" value_ (an async iterable) seamlessly.
 *
 * @example
 * ```tsx
 * import { It, type MaybeAsyncIterable } from 'react-async-iterators';
 *
 * function MyComponent(props: { values: MaybeAsyncIterable<string[]> }) {
 *   return (
 *     <ul>
 *       <It value={props.values} initialValue={[]}>
 *         {next => next.value.map((item, idx) =>
 *           <li key={idx}>{item}</li>
 *         )}
 *       </It>
 *     </ul>
 *   );
 * }
 * ```
 */
type MaybeAsyncIterable<T> = T | AsyncIterable<T>;
