import { type ReactNode } from 'react';
import { useAsyncIter, type IterationResult } from '../useAsyncIter/index.js';

export { Iterate, type IterateProps };

function Iterate<TVal, TInitialVal = undefined>(props: IterateProps<TVal, TInitialVal>): ReactNode {
  const renderOutput =
    typeof props.children === 'function'
      ? (() => {
          const propsBetterTyped = props as IteratePropsWithRenderFunction<TVal, TInitialVal>;
          const next = useAsyncIter(propsBetterTyped.value, propsBetterTyped.initialValue);
          return propsBetterTyped.children(next);
        })()
      : (() => {
          const propsBetterTyped = props as IteratePropsWithIterableAsChildren;
          const next = useAsyncIter(propsBetterTyped.children, propsBetterTyped.initialValue);
          return next.value;
        })();

  return renderOutput;
}

type IterateProps<TVal, TInitialVal = undefined> =
  | IteratePropsWithRenderFunction<TVal, TInitialVal>
  | IteratePropsWithIterableAsChildren;

type IteratePropsWithRenderFunction<TVal, TInitialVal = undefined> = {
  initialValue?: TInitialVal;
  value: TVal;
  children: (nextIterationState: IterationResult<TVal, TInitialVal>) => ReactNode;
};

type IteratePropsWithIterableAsChildren = {
  initialValue?: ReactNode;
  value?: undefined;
  children: ReactNode | AsyncIterable<ReactNode>;
};
