import { type MaybeFunction } from './MaybeFunction.js';

export { callWithArgsOrReturn };

function callWithArgsOrReturn<T, TPassedArgs extends unknown[]>(
  value: MaybeFunction<T, TPassedArgs>,
  ...argsToPass: TPassedArgs
): T {
  return typeof value !== 'function'
    ? value
    : (value as (...args: TPassedArgs) => T)(...argsToPass);
}
