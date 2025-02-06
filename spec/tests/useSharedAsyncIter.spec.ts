import { it, describe, expect, afterEach, vi } from 'vitest';
import { gray } from 'colorette';
import { range } from 'lodash-es';
import { renderHook, cleanup as cleanupMountedReactTrees, act } from '@testing-library/react';
import { useSharedAsyncIter, iterateFormatted } from '../libEntrypoint.js';
import { pipe } from '../utils/pipe.js';
import { IterableChannelTestHelper } from '../utils/IterableChannelTestHelper.js';
import { asyncIterOf } from '../utils/asyncIterOf.js';
import { feedChannelAcrossTicks } from '../utils/feedChannelAcrossTicks.js';
import { asyncIterToArray } from '../utils/asyncIterToArray.js';
import { asyncIterTake } from '../utils/asyncIterTake.js';
import { checkPromiseState } from '../utils/checkPromiseState.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`useSharedAsyncIter` hook', () => {
  it(gray('When updated with plain values, returns each as-is'), async () => {
    const results: string[] = [];

    const renderedHook = await act(() =>
      renderHook(({ value }) => useSharedAsyncIter(value), {
        initialProps: { value: '' },
      })
    );

    results.push(renderedHook.result.current);

    for (const value of ['a', 'b', 'c']) {
      await act(() => renderedHook.rerender({ value }));
      results.push(renderedHook.result.current);
    }

    expect(results).toStrictEqual(['', 'a', 'b', 'c']);
  });

  it(
    gray(
      'When given a source iterable, returns a shared iterable that its iterators mimic every yield of the source iterable'
    ),
    async () => {
      const iter = asyncIterOf('a', 'b', 'c');

      const sharedIter = (await act(() => renderHook(() => useSharedAsyncIter(iter)))).result
        .current;

      const values = await Promise.all([
        pipe(sharedIter, asyncIterToArray),
        pipe(sharedIter, asyncIterToArray),
      ]);

      expect(values).toStrictEqual([
        ['a', 'b', 'c'],
        ['a', 'b', 'c'],
      ]);
    }
  );

  it(
    gray(
      'Each iterator of the result iterable, upon getting manually closed, will immediately resolve all outstanding yieldings pulled through it to "done'
    ),
    async () => {
      const channel = new IterableChannelTestHelper<string>();

      const sharedIter = renderHook(() => useSharedAsyncIter(channel)).result.current;

      const iterator1 = sharedIter[Symbol.asyncIterator]();
      const iterator2 = sharedIter[Symbol.asyncIterator]();
      const yieldP1 = iterator1.next();
      const yieldP2 = iterator2.next();

      {
        await iterator1.return!();
        const promiseStates = await Promise.all([yieldP1, yieldP2].map(checkPromiseState));
        expect(promiseStates).toStrictEqual([
          { state: 'FULFILLED', value: { done: true, value: undefined } },
          { state: 'PENDING', value: undefined },
        ]);
      }

      {
        await iterator2.return!();
        const promiseStates = await Promise.all([yieldP1, yieldP2].map(checkPromiseState));
        expect(promiseStates).toStrictEqual([
          { state: 'FULFILLED', value: { done: true, value: undefined } },
          { state: 'FULFILLED', value: { done: true, value: undefined } },
        ]);
      }
    }
  );

  it(
    gray(
      "The source iterable's values are each shared between all the result iterable's consumers in parallel such that each will receive every value that will yield from the time it started consuming"
    ),
    async () => {
      const channel = new IterableChannelTestHelper<string>();
      const gen = (async function* () {
        yield* channel;
      })();

      const sharedIter = renderHook(() => useSharedAsyncIter(gen)).result.current;

      const consumeStacks: string[][] = [];

      for (const [i, value] of ['a', 'b', 'c'].entries()) {
        consumeStacks[i] = [];

        (async () => {
          for await (const v of sharedIter) consumeStacks[i].push(v);
        })();

        await act(() => channel.put(value));
      }

      expect(consumeStacks).toStrictEqual([['a', 'b', 'c'], ['b', 'c'], ['c']]);
    }
  );

  it(
    gray(
      'Obtains only one iterator from source iterable no matter how many iterators are obtained from result iterable'
    ),
    async () => {
      const iterStartSpy = vi.fn();

      const iter = {
        async *[Symbol.asyncIterator]() {
          iterStartSpy();
          while (true) {
            yield 'a';
          }
        },
      };

      const sharedIter = renderHook(() => useSharedAsyncIter(iter)).result.current;

      const firstIterator = sharedIter[Symbol.asyncIterator]();
      expect(iterStartSpy).not.toHaveBeenCalled();

      await firstIterator.next();
      expect(iterStartSpy).toHaveBeenCalledOnce();

      for (let i = 0; i < 2; ++i) {
        const iterator = sharedIter[Symbol.asyncIterator]();
        await iterator.next();
      }
      expect(iterStartSpy).toHaveBeenCalledOnce();
    }
  );

  describe(
    gray(
      'The obtained source iterator is closed only when the last remaining active iterator is closed'
    ),
    () => {
      it(gray('Closing remaining iterators one-by-one'), async () => {
        const mockSourceIterator = (async function* () {
          while (true) {
            yield 'a';
          }
        })();

        vi.spyOn(mockSourceIterator, 'return');

        const sharedIter = renderHook(() =>
          useSharedAsyncIter({ [Symbol.asyncIterator]: () => mockSourceIterator })
        ).result.current;

        const iterators = range(3).map(() => sharedIter[Symbol.asyncIterator]());

        await Promise.all(iterators.map(it => it.next()));
        expect(mockSourceIterator.return).not.toHaveBeenCalled();

        await iterators[2].return!();
        expect(mockSourceIterator.return).not.toHaveBeenCalled();

        await iterators[1].return!();
        expect(mockSourceIterator.return).not.toHaveBeenCalled();

        await iterators[0].return!();
        expect(mockSourceIterator.return).toHaveBeenCalledOnce();

        await Promise.all(iterators.map(it => it.return!()));
        expect(mockSourceIterator.return).toHaveBeenCalledOnce();
      });

      it(gray('Closing remaining iterators at the same time'), async () => {
        const mockSourceIterator = (async function* () {
          while (true) {
            yield 'a';
          }
        })();

        vi.spyOn(mockSourceIterator, 'return');

        const sharedIter = renderHook(() =>
          useSharedAsyncIter({ [Symbol.asyncIterator]: () => mockSourceIterator })
        ).result.current;

        const iterators = range(3).map(() => sharedIter[Symbol.asyncIterator]());

        await Promise.all(iterators.map(it => it.next()));
        expect(mockSourceIterator.return).not.toHaveBeenCalled();

        const returnCallsPromise = Promise.all(iterators.map(it => it.return!()));
        expect(mockSourceIterator.return).toHaveBeenCalledOnce();

        await returnCallsPromise;

        await Promise.all(iterators.map(it => it.return!()));
        expect(mockSourceIterator.return).toHaveBeenCalledOnce();
      });
    }
  );

  describe(
    gray(
      'As long as updated consecutively with the same source iterable will keep returning the same result iterable'
    ),
    () => {
      it(gray('with a regular iterable'), async () => {
        const iter1: AsyncIterable<string> = (async function* () {})();
        const iter2: AsyncIterable<string> = (async function* () {})();

        const renderedHook = renderHook(({ iter }) => useSharedAsyncIter(iter), {
          initialProps: { iter: iter1 },
        });

        const shared1s = range(3).map(() => {
          renderedHook.rerender({ iter: iter1 });
          return renderedHook.result.current;
        });
        const shared2s = range(3).map(() => {
          renderedHook.rerender({ iter: iter2 });
          return renderedHook.result.current;
        });

        expect(shared1s[0]).toStrictEqual(shared1s[1]);
        expect(shared1s[0]).toStrictEqual(shared1s[2]);

        expect(shared2s[0]).toStrictEqual(shared2s[1]);
        expect(shared2s[0]).toStrictEqual(shared2s[2]);

        expect(shared1s[0]).not.toStrictEqual(shared2s[0]);
      });

      it(gray('with formatted iterables of the same iterable'), async () => {
        const iter1: AsyncIterable<string> = (async function* () {})();
        const iter2: AsyncIterable<string> = (async function* () {})();

        const renderedHook = renderHook(({ iter }) => useSharedAsyncIter(iter), {
          initialProps: { iter: iter1 },
        });

        const shared1s = range(3).map(() => {
          renderedHook.rerender({ iter: iterateFormatted(iter1, v => v) });
          return renderedHook.result.current;
        });
        const shared2s = range(3).map(() => {
          renderedHook.rerender({ iter: iterateFormatted(iter2, v => v) });
          return renderedHook.result.current;
        });

        expect(shared1s[0]).toStrictEqual(shared1s[1]);
        expect(shared1s[0]).toStrictEqual(shared1s[2]);

        expect(shared2s[0]).toStrictEqual(shared2s[1]);
        expect(shared2s[0]).toStrictEqual(shared2s[2]);

        expect(shared1s[0]).not.toStrictEqual(shared2s[0]);
      });
    }
  );

  it(
    gray(
      'When updated with different formatted iterables of the same source iterable, applies formatting correctly'
    ),
    async () => {
      const channel = new IterableChannelTestHelper<string>();

      const renderedHook = renderHook(({ iter }) => useSharedAsyncIter(iter), {
        initialProps: {
          iter: iterateFormatted(channel, v => `${v}_formatted_1st_time`),
        },
      });

      const sharedIter = renderedHook.result.current;

      {
        feedChannelAcrossTicks(channel, ['a', 'b', 'c']);
        const resIter1Values = await pipe(sharedIter, asyncIterTake(3), asyncIterToArray);
        expect(resIter1Values).toStrictEqual([
          'a_formatted_1st_time',
          'b_formatted_1st_time',
          'c_formatted_1st_time',
        ]);
      }

      renderedHook.rerender({
        iter: iterateFormatted(channel, v => `${v}_formatted_2nd_time`),
      });

      {
        feedChannelAcrossTicks(channel, ['a', 'b', 'c']);
        const resIter1Values = await pipe(sharedIter, asyncIterTake(3), asyncIterToArray);
        expect(resIter1Values).toStrictEqual([
          'a_formatted_2nd_time',
          'b_formatted_2nd_time',
          'c_formatted_2nd_time',
        ]);
      }
    }
  );
});
