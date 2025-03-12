import type * as React from 'react';
import { useEffect } from 'react';
import { useRefWithInitialValue } from '../common/hooks/useRefWithInitialValue.js';
import {
  useAsyncItersImperatively,
  type IterationResultSet,
} from '../common/useAsyncItersImperatively/index.js';
import { arrayShallowEqual } from './arrayShallowEqual.js';

export { useAsyncIterEffect, type IterationResultSet };

/**
 * Given some async iterables, a side-effect function and a computed list of dependencies - runs the
 * provided side-effect whenever any of the provided dependencies change from the previously
 * seen ones, letting you derive them from the values yielded by the async iterables.
 *
 * This hook is like an _async-iterable-aware_ version for
 * {@link https://react.dev/reference/react/useEffect `React.useEffect`}, allowing dependencies to be
 * also computed from values yielded by the given async iterables each time, and letting the effect
 * fire directly in reaction to particular async iterable yields rather than only just component scope
 * values being changed across re-renders
 * (as does the classic {@link https://react.dev/reference/react/useEffect `React.useEffect`}).
 *
 * @example
 *
 * ```tsx
 * useAsyncIterEffect(
 *   [fooIter, barIter],
 *   (foo, bar) => [
 *     () => {
 *       runMyEffect(foo.value, bar.value, otherValue);
 *     },
 *     [foo.value, bar.value, otherValue],
 *   ]
 * );
 *
 * // Or if returning an effect destructor function:
 * useAsyncIterEffect(
 *   [fooIter, barIter],
 *   (foo, bar) => [
 *     () => {
 *       runMyEffect(foo.value, bar.value, otherValue);
 *       return () => {
 *         cancelMyEffect();
 *       }
 *     },
 *     [foo.value, bar.value, otherValue],
 *   ]
 * );
 * ```
 *
 * ---
 *
 * @description
 *
 * This hook is a consuming hook; any given item on the base deps array (first argument) that is async
 * iterable will immediately start being iterated internally and continue for as long as its underlying
 * iterable remains present in the array. Like most other hooks - plain (non async iterable) values can
 * also be provided within the base deps at any time be conveyed as if are immediate, singular yields.
 *
 * Whenever either of following events occur;
 *
 * - Any of the base deps yields a value
 * - Hook is called again due to component re-render
 *
 * -> the hook will call the effect resolver function (second argument) again, providing all the last
 * states of the actively iterated items as individual arguments corresponding to their order within the
 * base deps array. From there, you use it exactly like
 * {@link https://react.dev/reference/react/useEffect `React.useEffect`} while having the last yields
 * accesible to use for your actual effect dependencies and/or your effect function's logic itself.
 * The hook supports returning from the effect function an optional function to serve as the effect
 * tear down/destructor, like the original
 * {@link https://react.dev/reference/react/useEffect `React.useEffect`}.
 *
 * @template TBaseDeps The array/tuple type for the set of async iterable or plain values.
 *
 * @param baseDeps An array of zero or more async iterable or plain values (mixable). In response to their yields, effect dependencies will re-evaluate and possibly fire the effect.
 * @param effectResolverFn A user-provided function to be called by the hook whenever any yield occurres, getting the last states of all the actively iterated base deps as arguments. It should return a tuple with the effect function as the first item (_required_) and the next array of dependencies as the second (_optional_). The effect function may _optionally_ itself return a function to serve as a effect teardown/destructor.
 *
 * @see {@link IterationResultSet `IterationResultSet`}
 */
function useAsyncIterEffect<const TBaseDeps extends readonly unknown[]>(
  baseDeps: TBaseDeps,
  effectResolverFn: (
    ...baseDepsResolvedValues: IterationResultSet<TBaseDeps>
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
