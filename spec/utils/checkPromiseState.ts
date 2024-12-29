export { checkPromiseState, type PromiseCurrentState };

async function checkPromiseState<T>(p: Promise<T>): Promise<PromiseCurrentState<T>> {
  let result: PromiseCurrentState<T> = { state: 'PENDING', value: undefined };

  p.then(
    val => (result = { state: 'FULFILLED', value: val }),
    reason => (result = { state: 'REJECTED', value: reason })
  );

  await undefined;

  return result;
}

type PromiseCurrentState<T> =
  | { state: 'PENDING'; value: void }
  | { state: 'FULFILLED'; value: T }
  | { state: 'REJECTED'; value: unknown };
