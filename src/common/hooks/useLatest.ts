import { useRef } from 'react';

export { useLatest };

function useLatest<T>(nextValue: T): { current: T } {
  const ref = useRef(nextValue);
  ref.current = nextValue;
  return ref;
}
