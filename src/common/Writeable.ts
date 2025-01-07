export { type Writeable };

type Writeable<T> = {
  -readonly [P in keyof T]: T[P];
};
