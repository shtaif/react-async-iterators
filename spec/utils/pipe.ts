export { pipe };

const pipe: PipeFunction = (initVal: unknown, ...funcs: ((...args: any[]) => any)[]) => {
  return funcs.reduce((currVal, nextFunc) => nextFunc(currVal), initVal);
};

interface PipeFunction {
  <const TInitVal>(initVal: TInitVal): TInitVal;

  <const TInitVal, A>(initVal: TInitVal, ...funcs: [(arg: TInitVal) => A]): A;

  <const TInitVal, A, B>(initVal: TInitVal, ...funcs: [(arg: TInitVal) => A, (arg: A) => B]): B;

  <const TInitVal, A, B, C>(
    initVal: TInitVal,
    ...funcs: [(arg: TInitVal) => A, (arg: A) => B, (arg: B) => C]
  ): C;

  <const TInitVal, A, B, C, D>(
    initVal: TInitVal,
    ...funcs: [(arg: TInitVal) => A, (arg: A) => B, (arg: B) => C, (arg: C) => D]
  ): D;

  <const TInitVal, A, B, C, D, E>(
    initVal: TInitVal,
    ...funcs: [(arg: TInitVal) => A, (arg: A) => B, (arg: B) => C, (arg: C) => D, (arg: D) => E]
  ): E;

  <const TInitVal, A, B, C, D, E, F>(
    initVal: TInitVal,
    ...funcs: [
      (arg: TInitVal) => A,
      (arg: A) => B,
      (arg: B) => C,
      (arg: C) => D,
      (arg: D) => E,
      (arg: E) => F,
    ]
  ): F;

  <const TInitVal, A, B, C, D, E, F, G>(
    initVal: TInitVal,
    ...funcs: [
      (arg: TInitVal) => A,
      (arg: A) => B,
      (arg: B) => C,
      (arg: C) => D,
      (arg: D) => E,
      (arg: E) => F,
      (arg: F) => G,
    ]
  ): G;

  <const TInitVal, A, B, C, D, E, F, G, H>(
    initVal: TInitVal,
    ...funcs: [
      (arg: TInitVal) => A,
      (arg: A) => B,
      (arg: B) => C,
      (arg: C) => D,
      (arg: D) => E,
      (arg: E) => F,
      (arg: F) => G,
      (arg: G) => H,
    ]
  ): H;

  <const TInitVal, A, B, C, D, E, F, G, H, I>(
    initVal: TInitVal,
    ...funcs: [
      (arg: TInitVal) => A,
      (arg: A) => B,
      (arg: B) => C,
      (arg: C) => D,
      (arg: D) => E,
      (arg: E) => F,
      (arg: F) => G,
      (arg: G) => H,
      (arg: H) => I,
    ]
  ): I;

  <const TInitVal, A, B, C, D, E, F, G, H, I, J>(
    initVal: TInitVal,
    ...funcs: [
      (arg: TInitVal) => A,
      (arg: A) => B,
      (arg: B) => C,
      (arg: C) => D,
      (arg: D) => E,
      (arg: E) => F,
      (arg: F) => G,
      (arg: G) => H,
      (arg: H) => I,
      (arg: I) => J,
    ]
  ): J;
}
