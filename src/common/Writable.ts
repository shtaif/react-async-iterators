export { type Writable };

type Writable<T> = {
  -readonly [P in keyof T]: T[P];
};
