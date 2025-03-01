import { useEffect } from 'react';
import { useRefWithInitialValue } from '../common/hooks/useRefWithInitialValue.js';
import { type IterationResult } from '../useAsyncIter/index.js';
import {
  useAsyncItersImperatively,
  type IterationResultSet,
} from '../common/useAsyncItersImperatively/index.js';

export { useAsyncIterEffect, type IterationResult, type IterationResultSet };

/**
 * `useAsyncIterEffect`
 */
function useAsyncIterEffect<const TDeps extends readonly unknown[]>(
  effectCallback: EffectCallback<TDeps>,
  deps: TDeps,
  depValueMapper: DepValueMapperCallback<TDeps> = defaultDepValueMapper
): void {
  const ref = useRefWithInitialValue(() => ({
    lastDestructorFn: undefined as EffectDestructor,
    prevMappedDepVals: [] as unknown[],
  }));

  const handlePossibleDepsChange = (values: IterationResultSet<TDeps>): void => {
    const mappedDepVals = depValueMapper(...values);

    if (!arrayShallowEqual(mappedDepVals, ref.current.prevMappedDepVals)) {
      ref.current.prevMappedDepVals = mappedDepVals;
      ref.current.lastDestructorFn?.();
      ref.current.lastDestructorFn = effectCallback(...values);
    }
  };

  const currValuesReturned = useAsyncItersImperatively(deps, currValues => {
    handlePossibleDepsChange(currValues);
  });

  useEffect(() => {
    handlePossibleDepsChange(currValuesReturned);
  });

  useEffect(() => {
    return () => {
      ref.current.lastDestructorFn?.();
    };
  }, []);
}

function defaultDepValueMapper<TDepValues extends readonly IterationResult<unknown>[]>(
  ...depVals: TDepValues
): unknown[] {
  return depVals.flatMap(d => [d.value, d.pendingFirst, d.done]);
}

function arrayShallowEqual(arr1: readonly unknown[], arr2: readonly unknown[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; ++i) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

type EffectCallback<TInputDeps extends readonly unknown[] = readonly []> = (
  ...depVals: IterationResultSet<TInputDeps>
) => void | (() => void);

type EffectDestructor = void | (() => void);

type DepValueMapperCallback<TInputDeps extends readonly unknown[] = readonly []> = (
  ...depVals: IterationResultSet<TInputDeps>
) => unknown[];
