import { nextTick } from 'node:process';
import { type IterableChannelTestHelper } from './IterableChannelTestHelper.js';

export { feedChannelAcrossTicks };

async function feedChannelAcrossTicks<const T>(
  channel: IterableChannelTestHelper<T>,
  values: T[]
): Promise<void> {
  for (const value of values) {
    await new Promise(resolve => nextTick(resolve));
    channel.put(value);
  }
}
