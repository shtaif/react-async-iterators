import type * as React from 'react';
import { useMemo } from 'react';
import {
  reactAsyncIterSpecialInfoSymbol,
  type ReactAsyncIterable,
} from '../../ReactAsyncIterable.js';
import { useLatest } from '../useLatest.js';
import { asyncIterSyncMap } from '../../asyncIterSyncMap.js';
import { type DeasyncIterized } from '../../DeasyncIterized.js';

export { useAsyncIterMemo };

const useAsyncIterMemo: {
  <TRes, const TDeps extends React.DependencyList>(
    factory: (...depsWithWrappedAsyncIters: DepsWithReactAsyncItersWrapped<TDeps>) => TRes,
    deps: TDeps
  ): TRes;

  <TRes>(factory: () => TRes, deps: []): TRes;
} = <TRes, const TDeps extends React.DependencyList>(
  factory: (...depsWithWrappedAsyncIters: DepsWithReactAsyncItersWrapped<TDeps>) => TRes,
  deps: TDeps
) => {
  const latestDepsRef = useLatest(deps);

  const depsWithFormattedItersAccountedFor = latestDepsRef.current.map(dep =>
    isReactAsyncIterable(dep) ? dep[reactAsyncIterSpecialInfoSymbol].origSource : dep
  );

  const result = useMemo(() => {
    const depsWithWrappedFormattedIters = latestDepsRef.current.map((dep, i) => {
      const specialInfo = isReactAsyncIterable(dep)
        ? dep[reactAsyncIterSpecialInfoSymbol]
        : undefined;

      return !specialInfo
        ? dep
        : (() => {
            let iterationIdx = 0;

            return asyncIterSyncMap(
              specialInfo.origSource,
              value =>
                (latestDepsRef.current[i] as ReactAsyncIterable<unknown, unknown>)[
                  reactAsyncIterSpecialInfoSymbol
                ].formatFn(value, iterationIdx++) // TODO: Any chance there won't be a `.formatFn` here if its possible that this might be called somehow at the moment the deps were changed completely?
            );
          })();
    }) as DepsWithReactAsyncItersWrapped<TDeps>;

    return factory(...depsWithWrappedFormattedIters);
  }, depsWithFormattedItersAccountedFor);

  return result;
};

//TODO: Improve name of this type and the one below?
type DepsWithReactAsyncItersWrapped<TDeps extends React.DependencyList> = {
  [I in keyof TDeps]: TDeps[I] extends ReactAsyncIterable<unknown, unknown>
    ? AsyncIterable<DeasyncIterized<TDeps[I]>>
    : TDeps[I];
};

function isReactAsyncIterable<T>(input: T): input is T & ReactAsyncIterable<unknown, unknown> {
  const inputAsAny = input as any;
  return !!inputAsAny?.[reactAsyncIterSpecialInfoSymbol];
}
