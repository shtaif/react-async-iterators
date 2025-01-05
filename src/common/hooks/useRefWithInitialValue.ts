import { useRef, type MutableRefObject } from 'react';

export { useRefWithInitialValue };

function useRefWithInitialValue<T = undefined>(initialValueFn: () => T): MutableRefObject<T> {
  const isRefInitializedRef = useRef<boolean>();

  const ref = useRef<T>();

  if (!isRefInitializedRef.current) {
    isRefInitializedRef.current = true;
    ref.current = initialValueFn();
  }

  const refNonNull = ref as typeof ref & { current: T };

  return refNonNull;
}
