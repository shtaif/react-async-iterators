import { useEffect } from 'react';
import { useSimpleRerender } from '../common/hooks/useSimpleRerender.js';
import { useRefWithInitialValue } from '../common/hooks/useRefWithInitialValue.js';
import { isAsyncIter } from '../common/isAsyncIter.js';
import { type IterationResult } from '../useAsyncIter/index.js';
import { asyncIterSyncMap } from '../common/asyncIterSyncMap.js';
import { parseReactAsyncIterable } from '../common/ReactAsyncIterable.js';
import { iterateAsyncIterWithCallbacks } from '../common/iterateAsyncIterWithCallbacks.js';

export { useAsyncIterMulti, type IterationResult, type IterationResultSet };

// TODO: The initial values should be able to be given as functions, having them called once on mount if so

/**
 * `useAsyncIterMulti` hooks up multiple async iterables to your component and its lifecycle, letting
 * additional async iterables be added or removed on the go.
 *
 * Similar to `useAsyncIter`, only it works with zero or more async iterables and plain values instead of
 * a single one.
 *
 * @example
 * ```tsx
 * import { useAsyncIterMulti } from 'react-async-iterators';
 *
 * const wordGen = (async function* () {
 *   const words = ['Hello', 'React', 'Async', 'Iterators'];
 *   for (const word of words) {
 *     await new Promise(resolve => setTimeout(resolve, 1500));
 *     yield word;
 *   }
 * })();
 *
 * const fruitGen = (async function* () {
 *   const sets = [
 *     ['Peach', 'Mango', 'Orange'],
 *     ['Apple', 'Pear', 'Guyava'],
 *     ['Watermelon', 'Kiwi', 'Grapes'],
 *   ];
 *   for (const fruits of sets) {
 *     await new Promise(resolve => setTimeout(resolve, 2000));
 *     yield fruits;
 *   }
 * })();
 *
 * function MyComponent() {
 *   const [currentWords, currentFruits] = useAsyncIterMulti([wordGen, fruitGen]);
 *
 *   return (
 *     <div>
 *       <h2>
 *         Current word:
 *         {currentWords.pendingFirst
 *           ? 'Loading fruits...'
 *           : currentWords.error
 *           ? `Error: ${currentWords.error}`
 *           : currentWords.done
 *           ? `Done (last value: ${currentWords.value})`
 *           : `Value: ${currentWords.value}`}
 *       </h2>
 *       <ul>
 *         {currentFruits.pendingFirst
 *           ? 'Loading words...'
 *           : currentFruits.value.map(fruit => (
 *             <div key={fruit.name}>{fruit.name}</div>
 *           ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 *
 * Given an array of async iterables for `inputs`, this hook will iterate over all of them concurrently,
 * updating (re-rendering) the host component whenever any yields a value, completes, or errors outs -
 * each time returning a combined array of all their current individual states, corresponding to their
 * original positions in the given `inputs`.
 * `inputs` may also be mixed with plain (non async iterable) values, in which case they'll simply be
 * returned as-are, coinciding along current values of other async iterables.
 * This can enable components that could seamlessly handle _"static"_ as well as _"changing"_ values
 * and props.
 *
 * The hook initializes and maintains its iteration process with each async iterable object as long as
 * that same object remains present in `inputs` arrays across subsequent updates. Changing the position
 * of such object in the array on a consequent call will __not__ close its current running iteration - it
 * will only change the position its result would appear at in the returned array.
 * Care should be taken therefore to not unintentionally recreate the given iterables on every render,
 * by e.g; declaring an iterable outside the component body, control __when__ it should be recreated
 * with React's [`useMemo`](https://react.dev/reference/react/useMemo) or alternatively use the library's
 * {@link iterateFormatted `iterateFormatted`} util for a formatted version of an iterable which
 * preserves its identity.
 * Whenever `useAsyncIterMulti` detects that one or more previously present async iterables have
 * disappeared from the `inputs` array, it will close their iteration processes.
 * On component unmount, the hook will also ensure closing all actively iterated async iterables.
 *
 * The array returned from `useAsyncIterMulti` contains all the individual most recent states of all
 * actively iterated objects and/or plain values from the current `inputs` (including each's most recent
 * value, who's completed, etc. - see {@link IterationResultSet `IterationResultSet`}).
 *
 * @template TValues The type of the set of all plain or async iterable input values an array.
 * @template TInitValues The type of all initial values corresponding to types of `TValues`.
 *
 * @param inputs An array of zero or more async iterable or plain values (mixed).
 * @param {object} opts An _optional_ object with options.
 * @param opts.initialValues An _optional_ array of initial values, in which each item provides a starting value for an async iterable on the same index in the `inputs` array. For every async iterable that has no corresponding initial value in this array, the default initial value is `undefined`.
 *
 * @returns An array of objects that provide up-to-date information about each input's current value, completion status, whether it's still waiting for its first value and so on, correspondingly with the order in which they appear on `inputs (see {@link IterationResultSet `IterationResultSet`}).
 *
 * @see {@link IterationResultSet `IterationResultSet`}
 *
 * @example
 * ```tsx
 * // Using `useAsyncIterMulti` with a dynamically-changing amount of inputs:
 *
 * import { useState } from 'react';
 * import { useAsyncIterMulti, type MaybeAsyncIterable } from 'react-async-iterators';
 *
 * function DynamicInputsComponent() {
 *   const [inputs, setInputs] = useState<MaybeAsyncIterable<string>[]>([]);
 *
 *   const states = useAsyncIterMulti(inputs);
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
 *         {states.map((state, i) => (
 *           <li key={i}>
 *             {state.done
 *               ? state.error
 *                 ? `Error: ${state.error}`
 *                 : 'Done'
 *               : state.pendingFirst
 *                 ? 'Pending...'
 *                 : `Value: ${state.value}`}
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 * ```
 */
function useAsyncIterMulti<
  const TValues extends readonly unknown[],
  const TInitValues extends readonly unknown[] = readonly undefined[],
>(
  inputs: TValues,
  opts?: {
    initialValues?: TInitValues;
  }
): IterationResultSet<TValues, TInitValues>;

function useAsyncIterMulti(
  inputs: readonly unknown[],
  opts?: {
    initialValues?: readonly unknown[];
  }
): IterationResultSet<readonly unknown[], readonly unknown[]> {
  const update = useSimpleRerender();

  const ref = useRefWithInitialValue(() => ({
    currDiffCompId: 0,
    prevResults: [] as IterationResult<unknown, unknown>[],
    activeItersMap: new Map<
      AsyncIterable<unknown>,
      {
        diffCompId: number;
        destroy: () => void;
        formatFn: (value: unknown, i: number) => unknown;
        currState: IterationResult<unknown, unknown>;
      }
    >(),
  }));

  const { prevResults, activeItersMap } = ref.current;

  useEffect(() => {
    return () => {
      for (const it of activeItersMap.values()) {
        it.destroy();
      }
    };
  }, []);

  const initialValues = opts?.initialValues ?? [];

  const nextDiffCompId = (ref.current.currDiffCompId = ref.current.currDiffCompId === 0 ? 1 : 0);
  let numOfPrevRunItersPreserved = 0;
  const numOfPrevRunIters = activeItersMap.size;

  const nextResults = inputs.map((input, i) => {
    if (!isAsyncIter(input)) {
      return {
        value: input,
        pendingFirst: false as const,
        done: false as const,
        error: undefined,
      };
    }

    const { baseIter, formatFn } = parseReactAsyncIterable(input);

    const existingIterState = activeItersMap.get(baseIter);

    if (existingIterState) {
      numOfPrevRunItersPreserved++;
      existingIterState.diffCompId = nextDiffCompId;
      existingIterState.formatFn = formatFn;
      return existingIterState.currState;
    }

    const initialValue = prevResults[i] ? prevResults[i].value : initialValues[i]; // TODO: Sure this is the ideal behavior, to use prev iter that happened to be at that position as the value that a new one starts with, even though positions could have been shuffled?

    const formattedIter: AsyncIterable<unknown> = (() => {
      let iterationIdx = 0;
      return asyncIterSyncMap(baseIter, value => newIterState.formatFn(value, iterationIdx++));
    })();

    const destroyFn = iterateAsyncIterWithCallbacks(formattedIter, initialValue, next => {
      newIterState.currState = { pendingFirst: false, ...next };
      update();
    });

    const newIterState = {
      diffCompId: nextDiffCompId,
      destroy: destroyFn,
      formatFn,
      currState: {
        value: initialValue,
        pendingFirst: true as const,
        done: false as const,
        error: undefined,
      } as IterationResult<unknown, unknown>,
    };

    activeItersMap.set(baseIter, newIterState);

    return newIterState.currState;
  });

  const numOfPrevRunItersDisappeared = numOfPrevRunIters - numOfPrevRunItersPreserved;

  if (numOfPrevRunItersDisappeared > 0) {
    let i = 0;
    for (const { 0: iter, 1: state } of activeItersMap) {
      if (state.diffCompId !== nextDiffCompId) {
        activeItersMap.delete(iter);
        state.destroy();
        if (++i === numOfPrevRunItersDisappeared) {
          break;
        }
      }
    }
  }

  return (ref.current.prevResults = nextResults);
}

type IterationResultSet<
  TValues extends readonly unknown[],
  TInitValues extends readonly unknown[] = undefined[],
> = {
  [I in keyof TValues]: IterationResult<
    TValues[I],
    I extends keyof TInitValues ? TInitValues[I] : undefined
  >;
};
