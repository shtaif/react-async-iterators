import { it, describe, expect, afterEach } from 'vitest';
import { gray } from 'colorette';
import { range } from 'lodash-es';
import { renderHook, cleanup as cleanupMountedReactTrees, act } from '@testing-library/react';
import { useAsyncIterState } from '../../src/index.js';
import { asyncIterToArray } from '../utils/asyncIterToArray.js';
import { asyncIterTake } from '../utils/asyncIterTake.js';
import { checkPromiseState } from '../utils/checkPromiseState.js';
import { pipe } from '../utils/pipe.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`useAsyncIterState` hook', () => {
  it(gray('The returned iterable can be async-iterated upon successfully'), async () => {
    const [values, setValue] = renderHook(() => useAsyncIterState<string>()).result.current;

    const valuesToSet = ['a', 'b', 'c'];

    const collectPromise = pipe(values, asyncIterTake(valuesToSet.length), asyncIterToArray);
    const currentValues = [values.value.current];

    for (const value of valuesToSet) {
      await act(() => {
        setValue(value);
        currentValues.push(values.value.current);
      });
    }

    expect(await collectPromise).toStrictEqual(['a', 'b', 'c']);
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
      "The returned iterable's values are each shared between all its parallel consumers so that each receives all the values that will yield after the start of its consumption"
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
