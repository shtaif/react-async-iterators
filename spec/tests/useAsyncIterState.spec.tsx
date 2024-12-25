import { it, describe, expect, afterEach } from 'vitest';
import { gray } from 'colorette';
import { range } from 'lodash-es';
import { renderHook, cleanup as cleanupMountedReactTrees, act } from '@testing-library/react';
import { useAsyncIterState } from '../../src/index.js';
import { asyncIterToArray } from '../utils/asyncIterToArray.js';
import { asyncIterTake } from '../utils/asyncIterTake.js';
import { pipe } from '../utils/pipe.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`useAsyncIterState` hook', () => {
  it(gray('The returned iterable can be async-iterated upon successfully'), async () => {
    const [values, setValue] = renderHook(() => useAsyncIterState<string>()).result.current;

    const valuesToSet = ['a', 'b', 'c'];

    const collectPromise = pipe(values, asyncIterTake(valuesToSet.length), asyncIterToArray);

    for (const value of valuesToSet) {
      await act(() => setValue(value));
    }

    expect(await collectPromise).toStrictEqual(['a', 'b', 'c']);
  });

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

      await act(() => setValue('a'));

      renderedHook.unmount();

      const collections = await Promise.all([collectPromise1, collectPromise2]);
      expect(collections).toStrictEqual([['a'], ['a']]);
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
    }
  );

  it(
    gray(
      "The returned iterable's values are each shared between all its parallel consumers so that each receives all the values from the start of consumption and onwards"
    ),
    async () => {
      const [values, setValue] = renderHook(() => useAsyncIterState<string>()).result.current;

      const consumeStacks: string[][] = [];

      for (const [i, value] of ['a', 'b', 'c'].entries()) {
        consumeStacks[i] = [];
        (async () => {
          for await (const v of values) consumeStacks[i].push(v);
        })();
        await act(() => setValue(value));
      }

      expect(consumeStacks).toStrictEqual([['a', 'b', 'c'], ['b', 'c'], ['c']]);
    }
  );
});
