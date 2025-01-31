import { useMemo } from 'react';
import {
  reactAsyncIterSpecialInfoSymbol,
  type ReactAsyncIterable,
  type ReactAsyncIterSpecialInfo,
} from '../common/ReactAsyncIterable.js';
import { useLatest } from '../common/hooks/useLatest.js';
import { asyncIterSyncMap } from '../common/asyncIterSyncMap.js';
import { type DeasyncIterized } from '../common/DeasyncIterized.js';

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
                ].formatFn(value, iterationIdx++) // TODO: Any change there won't be a `.formatFn` here if its possible that this might be called somehow at the moment the deps were changed completely?
            );
          })();
    }) as DepsWithReactAsyncItersWrapped<TDeps>;

    return factory(...depsWithWrappedFormattedIters);
  }, depsWithFormattedItersAccountedFor);

  return result;
};

type DepsWithReactAsyncItersWrapped<TDeps extends React.DependencyList> = {
  [I in keyof TDeps]: TDeps[I] extends {
    [Symbol.asyncIterator](): AsyncIterator<unknown>;
    [reactAsyncIterSpecialInfoSymbol]: ReactAsyncIterSpecialInfo<unknown, unknown>;
  }
    ? AsyncIterable<DeasyncIterized<TDeps[I]>>
    : TDeps[I];
};

function isReactAsyncIterable<T>(input: T): input is T & ReactAsyncIterable<unknown, unknown> {
  const inputAsAny = input as any;
  return !!inputAsAny?.[reactAsyncIterSpecialInfoSymbol];
}
