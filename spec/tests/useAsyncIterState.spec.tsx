import { it, describe, expect, afterEach, vi } from 'vitest';
import { gray } from 'colorette';
import { range } from 'lodash-es';
import { renderHook, cleanup as cleanupMountedReactTrees, act } from '@testing-library/react';
import { useAsyncIterState } from '../../src/index.js';
import { asyncIterToArray } from '../utils/asyncIterToArray.js';
import { asyncIterTake } from '../utils/asyncIterTake.js';
import { asyncIterTakeFirst } from '../utils/asyncIterTakeFirst.js';
import { checkPromiseState } from '../utils/checkPromiseState.js';
import { pipe } from '../utils/pipe.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`useAsyncIterState` hook', () => {
  it(gray("The state iterable's `.current.value` property is read-only"), async () => {
    const [values] = renderHook(() => useAsyncIterState<string>()).result.current;

    expect(() => {
      (values.value as any).current = '...';
    }).toThrow(TypeError);
  });

  describe(
    gray(
      "When a non-`undefined` initial value is given, it's set as the starting value for the iterable's `.value.current` property"
    ),
    () => {
      for (const [desc, initVal] of [
        ['As a plain value', { initial: true } as const],
        ['As a function', () => ({ initial: true }) as const],
      ] as const) {
        it(gray(desc), async () => {
          const [values, setValue] = renderHook(() =>
            useAsyncIterState<string, { initial: true }>(initVal)
          ).result.current;

          const currentValues = [values.value.current];
          const yieldPromise = pipe(values, asyncIterTakeFirst());

          await act(() => {
            setValue('a');
            currentValues.push(values.value.current);
          });

          expect(await yieldPromise).toStrictEqual('a');
          expect(currentValues).toStrictEqual([{ initial: true }, 'a']);
        });
      }
    }
  );

  it(gray('The returned iterable can be async-iterated upon successfully'), async () => {
    const [values, setValue] = renderHook(() => useAsyncIterState<string>()).result.current;

    const valuesToSet = ['a', 'b', 'c'];

    const yieldsPromise = pipe(values, asyncIterTake(valuesToSet.length), asyncIterToArray);
    const currentValues = [values.value.current];

    for (const value of valuesToSet) {
      await act(() => {
        setValue(value);
        currentValues.push(values.value.current);
      });
    }

    expect(await yieldsPromise).toStrictEqual(['a', 'b', 'c']);
    expect(currentValues).toStrictEqual([undefined, 'a', 'b', 'c']);
  });

  it(
    gray(
      'Each iterator of the hook-returned iterable, upon getting manually closed, will immediately resolve all outstanding yieldings specifically pulled from it to "done'
    ),
    async () => {
      const [values] = renderHook(() => useAsyncIterState<string>()).result.current;

      const iterator1 = values[Symbol.asyncIterator]();
      const iterator2 = values[Symbol.asyncIterator]();
      const yieldPromise1 = iterator1.next();
      const yieldPromise2 = iterator2.next();

      await iterator1.return();

      {
        const promiseStates = await Promise.all(
          [yieldPromise1, yieldPromise2].map(checkPromiseState)
        );
        expect(promiseStates).toStrictEqual([
          { state: 'FULFILLED', value: { done: true, value: undefined } },
          { state: 'PENDING', value: undefined },
        ]);
      }

      await iterator2.return();

      {
        const promiseStates = await Promise.all(
          [yieldPromise1, yieldPromise2].map(checkPromiseState)
        );
        expect(promiseStates).toStrictEqual([
          { state: 'FULFILLED', value: { done: true, value: undefined } },
          { state: 'FULFILLED', value: { done: true, value: undefined } },
        ]);
      }
    }
  );

  it(gray('Updating states iteratively with the returned setter works correctly'), async () => {
    const [values, setValue] = renderHook(() => useAsyncIterState<number>()).result.current;

    const rounds = 3;

    const yieldsPromise = pipe(values, asyncIterTake(rounds), asyncIterToArray);
    const currentValues = [values.value.current];

    for (let i = 0; i < rounds; ++i) {
      await act(() => {
        setValue(i);
        currentValues.push(values.value.current);
      });
    }

    expect(currentValues).toStrictEqual([undefined, 0, 1, 2]);
    expect(await yieldsPromise).toStrictEqual([0, 1, 2]);
  });

  it(
    gray('Updating states as rapidly as possible with the returned setter works correctly'),
    async () => {
      const [values, setValue] = renderHook(() => useAsyncIterState<number>()).result.current;

      const yieldPromise = pipe(values, asyncIterTakeFirst());
      const currentValues = [values.value.current];

      for (let i = 0; i < 3; ++i) {
        setValue(i);
        currentValues.push(values.value.current);
      }

      expect(currentValues).toStrictEqual([undefined, 0, 1, 2]);
      expect(await yieldPromise).toStrictEqual(2);
    }
  );

  it(
    gray(
      'Updating states iteratively with the returned setter *in the functional form* works correctly'
    ),
    async () => {
      const renderFn = vi.fn<(prevState: number | undefined) => number>();
      const [values, setValue] = renderHook(() => useAsyncIterState<number>()).result.current;

      const rounds = 3;

      const yieldsPromise = pipe(values, asyncIterTake(rounds), asyncIterToArray);
      const currentValues = [values.value.current];

      for (let i = 0; i < rounds; ++i) {
        await act(() => {
          setValue(renderFn.mockImplementation(_prev => i));
          currentValues.push(values.value.current);
        });
      }

      expect(renderFn.mock.calls).toStrictEqual([[undefined], [0], [1]]);
      expect(currentValues).toStrictEqual([undefined, 0, 1, 2]);
      expect(await yieldsPromise).toStrictEqual([0, 1, 2]);
    }
  );

  it(
    gray(
      'Updating states as rapidly as possible with the returned setter *in the functional form* works correctly'
    ),
    async () => {
      const renderFn = vi.fn<(prevState: number | undefined) => number>();

      const [values, setValue] = renderHook(() => useAsyncIterState<number>()).result.current;

      const yieldPromise = pipe(values, asyncIterTakeFirst());

      const currentValues = [values.value.current];

      for (let i = 0; i < 3; ++i) {
        setValue(renderFn.mockImplementation(_prev => i));
        currentValues.push(values.value.current);
      }

      expect(renderFn.mock.calls).toStrictEqual([[undefined], [0], [1]]);
      expect(currentValues).toStrictEqual([undefined, 0, 1, 2]);
      expect(await yieldPromise).toStrictEqual(2);
    }
  );

  it(
    gray(
      'When hook is unmounted, all outstanding yieldings of the returned iterable resolve to "done"'
    ),
    async () => {
      const renderedHook = renderHook(() => useAsyncIterState<string>());
      const [values] = renderedHook.result.current;

      const [collectPromise1, collectPromise2] = range(2).map(() => asyncIterToArray(values));

      renderedHook.unmount();

      const collections = await Promise.all([collectPromise1, collectPromise2]);
      expect(collections).toStrictEqual([[], []]);
      expect(values.value.current).toStrictEqual(undefined);
    }
  );

  it(
    gray(
      'After setting some values followed by unmounting the hook, the pre-unmounting values go through while further values pulled from the returned iterable are always "done"'
    ),
    async () => {
      const renderedHook = renderHook(() => useAsyncIterState<string>());
      const [values, setValue] = renderedHook.result.current;

      const [collectPromise1, collectPromise2] = range(2).map(() => asyncIterToArray(values));
      const currentValues = [values.value.current];

      await act(() => {
        setValue('a');
        currentValues.push(values.value.current);
      });

      renderedHook.unmount();

      const collections = await Promise.all([collectPromise1, collectPromise2]);
      expect(collections).toStrictEqual([['a'], ['a']]);
      expect(currentValues).toStrictEqual([undefined, 'a']);
    }
  );

  it(
    gray(
      'After the hook is unmounted, any further values pulled from the returned iterable are always "done"'
    ),
    async () => {
      const renderedHook = renderHook(() => useAsyncIterState<string>());
      const [values] = renderedHook.result.current;

      renderedHook.unmount();

      const collections = await Promise.all(range(2).map(() => asyncIterToArray(values)));
      expect(collections).toStrictEqual([[], []]);
      expect(values.value.current).toStrictEqual(undefined);
    }
  );

  it(
    gray(
      "The returned iterable's values are each shared between all its parallel consumers so that each will receives all values that will yield from the time it started consuming"
    ),
    async () => {
      const [values, setValue] = renderHook(() => useAsyncIterState<string>()).result.current;

      const consumeStacks: string[][] = [];
      const currentValues = [values.value.current];

      for (const [i, value] of ['a', 'b', 'c'].entries()) {
        consumeStacks[i] = [];

        (async () => {
          for await (const v of values) consumeStacks[i].push(v);
        })();

        await act(() => {
          setValue(value);
          currentValues.push(values.value.current);
        });
      }

      expect(consumeStacks).toStrictEqual([['a', 'b', 'c'], ['b', 'c'], ['c']]);
      expect(currentValues).toStrictEqual([undefined, 'a', 'b', 'c']);
    }
  );
});
