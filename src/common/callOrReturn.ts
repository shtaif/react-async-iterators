import { type MaybeFunction } from './MaybeFunction.js';

export { callOrReturn };

function callOrReturn<T>(value: MaybeFunction<T>): T {
  return typeof value !== 'function' ? value : (value as () => T)();
}
