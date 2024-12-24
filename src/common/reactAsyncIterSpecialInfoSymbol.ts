export { reactAsyncIterSpecialInfoSymbol, type ReactAsyncIterSpecialInfo };

const reactAsyncIterSpecialInfoSymbol = Symbol('reactAsyncIterSpecialInfoSymbol');

type ReactAsyncIterSpecialInfo<TOrigVal, TFormattedVal> = {
  origSource: AsyncIterable<TOrigVal>;
  formatFn(value: TOrigVal, i: number): TFormattedVal;
};
