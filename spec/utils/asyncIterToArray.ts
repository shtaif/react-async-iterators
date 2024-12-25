export { asyncIterToArray };

async function asyncIterToArray<T>(source: AsyncIterable<T>): Promise<T[]> {
  const collected: T[] = [];
  for await (const value of source) {
    collected.push(value);
  }
  return collected;
}
