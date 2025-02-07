import { it, describe, expect, afterEach } from 'vitest';
import { gray } from 'colorette';
import { renderHook, cleanup as cleanupMountedReactTrees } from '@testing-library/react';
import { /*useAsyncIterMemo, */ iterateFormatted } from '../libEntrypoint.js';
import { useAsyncIterMemo } from '../../src/common/hooks/useAsyncIterMemo/index.js';
import { pipe } from '../utils/pipe.js';
import { IterableChannelTestHelper } from '../utils/IterableChannelTestHelper.js';
import { feedChannelAcrossTicks } from '../utils/feedChannelAcrossTicks.js';
import { asyncIterToArray } from '../utils/asyncIterToArray.js';
import { asyncIterTake } from '../utils/asyncIterTake.js';
import { asyncIterOf } from '../utils/asyncIterOf.js';
import { asyncIterTickSeparatedOf } from '../utils/asyncIterTickSeparatedOf.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`useAsyncIterMemo` hook', () => {
  it(gray('When given mixed iterable and plain values, will work correctly'), async () => {
    const renderedHook = renderHook(
      ({ val1, val2, iter1, iter2 }) =>
        useAsyncIterMemo((...deps) => deps, [val1, val2, iter1, iter2]),
      {
        initialProps: {
          val1: 'a',
          val2: 'b',
          iter1: asyncIterOf('a', 'b', 'c'),
          iter2: asyncIterOf('d', 'e', 'f'),
        },
      }
    );

    const [resVal1, resVal2, resIter1, resIter2] = renderedHook.result.current;

    expect(resVal1).toStrictEqual('a');
    expect(resVal2).toStrictEqual('b');
    expect(await asyncIterToArray(resIter1)).toStrictEqual(['a', 'b', 'c']);
    expect(await asyncIterToArray(resIter2)).toStrictEqual(['d', 'e', 'f']);
  });

  it(
    gray(
      'When updated consecutively with formatted iterables of the same source iterables each time, will work correctly and not re-run factory function'
    ),
    async () => {
      const channel1 = new IterableChannelTestHelper<string>();
      const channel2 = new IterableChannelTestHelper<string>();
      let timesRerun = 0;

      const renderedHook = renderHook(
        ({ val1, val2, iter1, iter2 }) =>
          useAsyncIterMemo(
            (...deps) => {
              timesRerun++;
              return deps;
            },
            [val1, val2, iter1, iter2]
          ),
        {
          initialProps: {
            val1: 'a',
            val2: 'b',
            iter1: iterateFormatted(channel1, v => `${v}_formatted_1st_time`),
            iter2: iterateFormatted(channel2, v => `${v}_formatted_1st_time`),
          },
        }
      );

      const hookFirstResult = renderedHook.result.current;

      {
        expect(timesRerun).toStrictEqual(1);

        const [, , resIter1, resIter2] = hookFirstResult;

        feedChannelAcrossTicks(channel1, ['a', 'b', 'c']);
        const resIter1Values = await pipe(resIter1, asyncIterTake(3), asyncIterToArray);
        expect(resIter1Values).toStrictEqual([
          'a_formatted_1st_time',
          'b_formatted_1st_time',
          'c_formatted_1st_time',
        ]);

        feedChannelAcrossTicks(channel2, ['d', 'e', 'f']);
        const resIter2Values = await pipe(resIter2, asyncIterTake(3), asyncIterToArray);
        expect(resIter2Values).toStrictEqual([
          'd_formatted_1st_time',
          'e_formatted_1st_time',
          'f_formatted_1st_time',
        ]);
      }

      renderedHook.rerender({
        val1: 'a',
        val2: 'b',
        iter1: iterateFormatted(channel1, v => `${v}_formatted_2nd_time`),
        iter2: iterateFormatted(channel2, v => `${v}_formatted_2nd_time`),
      });

      const hookSecondResult = renderedHook.result.current;

      {
        expect(timesRerun).toStrictEqual(1);
        expect(hookFirstResult).toStrictEqual(hookSecondResult);

        const [, , resIter1, resIter2] = hookSecondResult;

        feedChannelAcrossTicks(channel1, ['a', 'b', 'c']);
        const resIter1Values = await pipe(resIter1, asyncIterTake(3), asyncIterToArray);
        expect(resIter1Values).toStrictEqual([
          'a_formatted_2nd_time',
          'b_formatted_2nd_time',
          'c_formatted_2nd_time',
        ]);

        feedChannelAcrossTicks(channel2, ['d', 'e', 'f']);
        const resIter2Values = await pipe(resIter2, asyncIterTake(3), asyncIterToArray);
        expect(resIter2Values).toStrictEqual([
          'd_formatted_2nd_time',
          'e_formatted_2nd_time',
          'f_formatted_2nd_time',
        ]);
      }
    }
  );

  it(
    gray(
      'When updated consecutively with formatted iterables of different source iterables each time, will work correctly and re-run factory function'
    ),
    async () => {
      const iter1 = asyncIterTickSeparatedOf('a', 'b', 'c');
      const iter2 = asyncIterTickSeparatedOf('d', 'e', 'f');
      let timesRerun = 0;

      const renderedHook = renderHook(
        ({ val1, val2, iter1, iter2 }) =>
          useAsyncIterMemo(
            (...deps) => {
              timesRerun++;
              return deps;
            },
            [val1, val2, iter1, iter2]
          ),
        {
          initialProps: {
            val1: 'a',
            val2: 'b',
            iter1: iterateFormatted(iter1, v => `${v}_formatted_1st_time`),
            iter2: iterateFormatted(iter2, v => `${v}_formatted_1st_time`),
          },
        }
      );

      const hookFirstResult = renderedHook.result.current;

      {
        expect(timesRerun).toStrictEqual(1);

        const [, , resIter1, resIter2] = hookFirstResult;

        const resIter1Values = await pipe(resIter1, asyncIterTake(3), asyncIterToArray);
        expect(resIter1Values).toStrictEqual([
          'a_formatted_1st_time',
          'b_formatted_1st_time',
          'c_formatted_1st_time',
        ]);

        const resIter2Values = await pipe(resIter2, asyncIterTake(3), asyncIterToArray);
        expect(resIter2Values).toStrictEqual([
          'd_formatted_1st_time',
          'e_formatted_1st_time',
          'f_formatted_1st_time',
        ]);
      }

      const differentIter1 = asyncIterTickSeparatedOf('a', 'b', 'c');
      const differentIter2 = asyncIterTickSeparatedOf('d', 'e', 'f');

      renderedHook.rerender({
        val1: 'a',
        val2: 'b',
        iter1: iterateFormatted(differentIter1, v => `${v}_formatted_2nd_time`),
        iter2: iterateFormatted(differentIter2, v => `${v}_formatted_2nd_time`),
      });

      const hookSecondResult = renderedHook.result.current;

      {
        expect(timesRerun).toStrictEqual(2);

        expect(hookFirstResult[0]).toStrictEqual(hookSecondResult[0]);
        expect(hookFirstResult[1]).toStrictEqual(hookSecondResult[1]);
        expect(hookFirstResult[2]).not.toStrictEqual(hookSecondResult[2]);
        expect(hookFirstResult[3]).not.toStrictEqual(hookSecondResult[3]);

        const resIter1Values = await pipe(hookSecondResult[2], asyncIterTake(3), asyncIterToArray);
        expect(resIter1Values).toStrictEqual([
          'a_formatted_2nd_time',
          'b_formatted_2nd_time',
          'c_formatted_2nd_time',
        ]);

        const resIter2Values = await pipe(hookSecondResult[3], asyncIterTake(3), asyncIterToArray);
        expect(resIter2Values).toStrictEqual([
          'd_formatted_2nd_time',
          'e_formatted_2nd_time',
          'f_formatted_2nd_time',
        ]);
      }
    }
  );
});
