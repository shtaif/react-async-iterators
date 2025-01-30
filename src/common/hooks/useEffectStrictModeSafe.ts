import { useRef, useEffect, type EffectCallback, type DependencyList } from 'react';

export { useEffectStrictModeSafe };

function useEffectStrictModeSafe(effect: EffectCallback, deps?: DependencyList): void {
  const isPendingTeardownRef = useRef(false);

  useEffect(() => {
    const teardown = effect();

    if (teardown) {
      isPendingTeardownRef.current = false;

      return () => {
        if (isPendingTeardownRef.current) {
          return;
        }

        isPendingTeardownRef.current = true;

        (async () => {
          await undefined;
          if (isPendingTeardownRef.current) {
            teardown();
          }
        })();
      };
    }
  }, deps);
}
