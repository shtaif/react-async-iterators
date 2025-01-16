export { type DeasyncIterized };

type DeasyncIterized<T> = T extends AsyncIterable<infer InnerVal> ? InnerVal : T;
