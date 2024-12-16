import { type ReactNode } from 'react';
import { useAsyncIterable, type IterationResult } from '../useAsyncIterable/index.js';

export { Iterate, type IterateProps };

function Iterate<TVal, TInitialVal = undefined>(props: IterateProps<TVal, TInitialVal>): ReactNode {
  const renderOutput =
    typeof props.children === 'function'
      ? (() => {
          const propsBetterTyped = props as IteratePropsWithRenderFunction<TVal, TInitialVal>;
          const next = useAsyncIterable(propsBetterTyped.value, propsBetterTyped.initialValue);
          return propsBetterTyped.children(next);
        })()
      : (() => {
          const propsBetterTyped = props as IteratePropsWithIterableAsChildren;
          const next = useAsyncIterable(propsBetterTyped.children, propsBetterTyped.initialValue);
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
