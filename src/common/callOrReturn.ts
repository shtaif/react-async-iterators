export { callOrReturn };

function callOrReturn<T>(value: T | (() => T)): T {
  return typeof value !== 'function' ? value : (value as () => T)();
}
