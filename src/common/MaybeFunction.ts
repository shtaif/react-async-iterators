export { type MaybeFunction };

type MaybeFunction<T, TPossibleArgs extends unknown[] = []> = T | ((...args: TPossibleArgs) => T);
