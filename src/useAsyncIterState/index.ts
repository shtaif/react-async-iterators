import { useEffect, useRef } from 'react';
import { IterableChannel } from './IterableChannel.js';

export { useAsyncIterState, type AsyncIterStateResult };

/**
 * ... ... ...
 */
function useAsyncIterState<TVal>(): AsyncIterStateResult<TVal> {
  const ref = useRef<{
    channel: IterableChannel<TVal>;
    result: AsyncIterStateResult<TVal>;
  }>();

  if (!ref.current) {
    const channel = new IterableChannel<TVal>();
    ref.current = {
      channel,
      result: [channel.iterable, newVal => channel.put(newVal)],
    };
  }

  const { channel, result } = ref.current;

  useEffect(() => {
    return () => channel.close();
  }, []);

  return result;
}

type AsyncIterStateResult<TVal> = [AsyncIterable<TVal, void, void>, (newValue: TVal) => void];
