export { type ExtractAsyncIterValue };

type ExtractAsyncIterValue<T> = T extends AsyncIterable<infer InnerVal> ? InnerVal : T;
