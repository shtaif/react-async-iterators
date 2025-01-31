import { useRef, type MutableRefObject } from 'react';

export { useRefWithInitialValue };

function useRefWithInitialValue<T = undefined>(initialValueFn: () => T): MutableRefObject<T> {
  const isInitializedRef = useRef<boolean>();
  const ref = useRef<T>();

  if (!isInitializedRef.current) {
    isInitializedRef.current = true;
    ref.current = initialValueFn();
  }

  const refNonNullCurrent = ref as typeof ref & { current: T };

  return refNonNullCurrent;
}
