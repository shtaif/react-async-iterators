import { useEffect } from 'react';
import { type IterationResult } from '../../useAsyncIter/index.js';
import { type AsyncIterableSubject } from '../../AsyncIterableSubject/index.js';
import { type Writable } from '../Writable.js';
import { useRefWithInitialValue } from '../hooks/useRefWithInitialValue.js';
import { isAsyncIter } from '../isAsyncIter.js';
import { callOrReturn } from '../callOrReturn.js';
import { asyncIterSyncMap } from '../asyncIterSyncMap.js';
import { parseReactAsyncIterable } from '../ReactAsyncIterable.js';
import { iterateAsyncIterWithCallbacks } from '../iterateAsyncIterWithCallbacks.js';

export { useAsyncItersImperatively, type IterationResultSet };

const useAsyncItersImperatively: {
  <const TInputs extends readonly unknown[]>(
    inputs: TInputs,
    onYieldCb: (vals: IterationResultSet<TInputs>) => void,
    opts?: {
      initialValues?: undefined;
      defaultInitialValue?: undefined;
    }
  ): IterationResultSet<TInputs>;

  <
    const TInputs extends readonly unknown[],
    const TInitVals extends readonly unknown[] = readonly [],
  >(
    inputs: TInputs,
    onYieldCb: (vals: IterationResultSet<TInputs>) => void,
    opts: {
      initialValues: TInitVals;
      defaultInitialValue?: undefined;
    }
  ): IterationResultSet<TInputs, TInitVals>;

  <const TInputs extends readonly unknown[], const TDefaultInitValue = undefined>(
    inputs: TInputs,
    onYieldCb: (vals: IterationResultSet<TInputs>) => void,
    opts: {
      initialValues?: undefined;
      defaultInitialValue: TDefaultInitValue;
    }
  ): IterationResultSet<TInputs, [], TDefaultInitValue>;

  <
    const TInputs extends readonly unknown[],
    const TInitVals extends readonly unknown[] = readonly [],
    const TDefaultInitValue = undefined,
  >(
    inputs: TInputs,
    onYieldCb: (vals: IterationResultSet<TInputs>) => void,
    opts: {
      initialValues: TInitVals;
      defaultInitialValue: TDefaultInitValue;
    }
  ): IterationResultSet<TInputs, TInitVals, TDefaultInitValue>;
} = <
  const TInputs extends readonly unknown[],
  const TInitVals extends readonly unknown[] = readonly [],
  const TDefaultInitValue = undefined,
>(
  inputs: TInputs,
  onYieldCb: (vals: IterationResultSet<TInputs, TInitVals, TDefaultInitValue>) => void,
  opts?: {
    initialValues?: TInitVals;
    defaultInitialValue?: TDefaultInitValue;
  }
): IterationResultSet<TInputs, TInitVals, TDefaultInitValue> => {
  const optsNormed = {
    initialValues: opts?.initialValues ?? [],
    defaultInitialValue: opts?.defaultInitialValue,
  };

  const ref = useRefWithInitialValue(() => ({
    currDiffCompId: 0,
    currResults: [] as IterationResultSet<TInputs, TInitVals, TDefaultInitValue>,
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

  const { activeItersMap } = ref.current;

  useEffect(() => {
    return () => {
      for (const it of activeItersMap.values()) {
        it.destroy();
      }
    };
  }, []);

  const nextDiffCompId = (ref.current.currDiffCompId = ref.current.currDiffCompId === 0 ? 1 : 0);
  let numOfPrevRunItersPreserved = 0;
  const numOfPrevRunIters = activeItersMap.size;

  ref.current.currResults = inputs.map((input, i) => {
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

    const inputWithMaybeCurrentValue = input as typeof input & {
      value?: AsyncIterableSubject<unknown>['value'];
    };

    let iterationIdx: number;
    let pendingFirst: boolean;
    let startingValue;

    if (inputWithMaybeCurrentValue.value) {
      iterationIdx = 1; // If source has a current value, it should have been the "first iteration" already, so in that case the right up next one here is *the second* already (index of 1)
      pendingFirst = false;
      startingValue = inputWithMaybeCurrentValue.value.current;
    } else {
      iterationIdx = 0;
      pendingFirst = true;
      startingValue =
        i < ref.current.currResults.length
          ? ref.current.currResults[i].value
          : callOrReturn(
              i < optsNormed.initialValues.length
                ? optsNormed.initialValues[i]
                : optsNormed.defaultInitialValue
            );
    }

    const formattedIter: AsyncIterable<unknown> = asyncIterSyncMap(baseIter, value =>
      iterState.formatFn(value, iterationIdx++)
    );

    const destroyFn = iterateAsyncIterWithCallbacks(formattedIter, startingValue, next => {
      iterState.currState = { pendingFirst: false, ...next };
      ref.current.currResults = (() => {
        const newResults = ref.current.currResults.slice(0); // Using `.slice(0)` in attempt to copy the array faster than `[...ref.current.currResults]` would
        newResults[i] = iterState.currState;
        return newResults as typeof ref.current.currResults;
      })();
      onYieldCb(ref.current.currResults);
    });

    const iterState = {
      diffCompId: nextDiffCompId,
      destroy: destroyFn,
      formatFn,
      currState: {
        value: startingValue,
        pendingFirst,
        done: false as const,
        error: undefined,
      } as IterationResult<unknown, unknown>,
    };

    activeItersMap.set(baseIter, iterState);

    return iterState.currState;
  }) as Writable<IterationResultSet<TInputs, TInitVals, TDefaultInitValue>>;

  // TODO: If the consumers of `useAsyncItersImperatively` within the library are intending to use it in conjunction with `React.useEffect` (e.g. `useAsyncIterEffect`) - do we really need to do such individual length comparisons and cleanups like the following? `React.useEffect` enforces strict static-length deps anyways
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

  return ref.current.currResults;
};

type IterationResultSet<
  TValues extends readonly unknown[],
  TInitValues extends readonly unknown[] = readonly [],
  TDefaultInitValue = undefined,
> = {
  [I in keyof TValues]: IterationResult<
    TValues[I],
    I extends keyof TInitValues ? TInitValues[I] : TDefaultInitValue
  >;
};
