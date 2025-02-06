import { identity } from './identity.js';

export {
  parseReactAsyncIterable,
  reactAsyncIterSpecialInfoSymbol,
  type ReactAsyncIterable,
  type ReactAsyncIterSpecialInfo,
};

function parseReactAsyncIterable<T>(
  value: AsyncIterable<T> & Partial<ReactAsyncIterable<unknown, T>>
): {
  baseIter: ReactAsyncIterSpecialInfo<unknown, T>['origSource'];
  formatFn: ReactAsyncIterSpecialInfo<unknown, T>['formatFn'];
} {
  if (value[reactAsyncIterSpecialInfoSymbol]) {
    const { origSource, formatFn } = value[reactAsyncIterSpecialInfoSymbol];
    return {
      baseIter: origSource,
      formatFn: formatFn,
    };
  }
  return {
    baseIter: value,
    formatFn: identity<T>,
  };
}

const reactAsyncIterSpecialInfoSymbol = Symbol('reactAsyncIterSpecialInfoSymbol');

type ReactAsyncIterable<TVal, TValFormatted> = AsyncIterable<TValFormatted /*, void, void*/> & {
  [reactAsyncIterSpecialInfoSymbol]: ReactAsyncIterSpecialInfo<TVal, TValFormatted>;
};

type ReactAsyncIterSpecialInfo<TOrigVal, TFormattedVal> = {
  origSource: AsyncIterable<TOrigVal>;
  formatFn(value: TOrigVal, i: number): TFormattedVal;
};
