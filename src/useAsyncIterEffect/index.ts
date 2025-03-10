import type * as React from 'react';
import { useEffect } from 'react';
import { useRefWithInitialValue } from '../common/hooks/useRefWithInitialValue.js';
import { type IterationResult } from '../useAsyncIter/index.js';
import {
  useAsyncItersImperatively,
  type IterationResultSet,
} from '../common/useAsyncItersImperatively/index.js';
import { arrayShallowEqual } from './arrayShallowEqual.js';

export { useAsyncIterEffect, type IterationResult, type IterationResultSet };

/**
 * Given some async iterables, a side-effect function and a computed list of dependencies - runs the
 * provided side-effect whenever any of the provided dependencies change from the previously
 * seen ones.
 *
 * This hook is like an _async-iterable-aware_ version for
 * {@link https://react.dev/reference/react/useEffect `React.useEffect`}, allowing dependencies to be
 * computed also from values yielded by the given async iterables each time, and the effect therefore can
 * fire in reaction to yields of async iterables as well as regular changes in component scope values during
 * re-renders (as does the classic {@link https://react.dev/reference/react/useEffect `React.useEffect`}).
 *
 * @example
 *
 * ```tsx
 * useAsyncIterEffect(
 *   [asyncIter1, asyncIter2],
 *   (res1, res2) => [
 *     () => {
 *       runMyEffect(res1.value, res2.value, otherValue);
 *     },
 *     [res1.value, res2.value, otherValue],
 *   ]
 * );
 *
 * // Or if returning an effect destructor function:
 * useAsyncIterEffect(
 *   [asyncIter1, asyncIter2],
 *   (res1, res2) => [
 *     () => {
 *       runMyEffect(res1.value, res2.value, otherValue);
 *       return () => {
 *         cancelMyEffect();
 *       }
 *     },
 *     [res1.value, res2.value, otherValue],
 *   ]
 * );
 * ```
 *
 * @description
 *
 * This hook is like {@link https://react.dev/reference/react/useEffect `React.useEffect`},
 * only it is _async-iterable-aware_ in that, any given dependencies which are async iterable will
 * immediately start iterations which may persist for as long as their underlying iterables remain
 * present in the given dependencies. For each such async iterable dependency, any subsequent
 * yield may also trigger the effect callback the same way as changing the actual input dependencies
 * themselves would.
 *
 * In order to use the yielded values within the provided effect function - the hook makes
 * the most recent yields of all current dependencies accessible as arguments injected to
 * the effect callback (based on to the same order they are given by in the dependencies
 * array), which is different from
 * {@link https://react.dev/reference/react/useEffect `React.useEffect`}.
 */
function useAsyncIterEffect<const TBaseDeps extends readonly unknown[]>(
  baseDeps: TBaseDeps,
  effectResolverFn: (
    ...valsOfBaseDeps: IterationResultSet<TBaseDeps>
  ) => readonly [EffectCallback, React.DependencyList?]
): void {
  const ref = useRefWithInitialValue(() => ({
    currDestructorFn: undefined as EffectDestructor,
    lastInnerDeps: undefined as undefined | React.DependencyList,
  }));

  const currBaseDepVals = useAsyncItersImperatively(baseDeps, yieldedBaseDepVals => {
    handleNextRound(yieldedBaseDepVals);
  });

  useEffect(() => {
    handleNextRound(currBaseDepVals);
  });

  function handleNextRound(nextBaseDepVals: IterationResultSet<TBaseDeps>) {
    const { 0: effectFn, 1: innerDeps } = effectResolverFn(...nextBaseDepVals);

    if (
      !innerDeps ||
      !ref.current.lastInnerDeps ||
      !arrayShallowEqual(innerDeps, ref.current.lastInnerDeps)
    ) {
      try {
        ref.current.currDestructorFn?.();
      } finally {
        try {
          const effectReturn = effectFn();
          if (typeof effectReturn === 'function') {
            ref.current.currDestructorFn = effectReturn;
          }
        } finally {
          ref.current.lastInnerDeps = innerDeps;
        }
      }
    }
  }

  useEffect(() => {
    return () => {
      ref.current.currDestructorFn?.();
    };
  }, []);
}

type EffectCallback = () => EffectDestructor;

type EffectDestructor = void | (() => void);
