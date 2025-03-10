import { it, describe, expect, afterEach, vi } from 'vitest';
import { gray } from 'colorette';
import {
  cleanup as testingLibraryCleanupAllMountings,
  act,
  renderHook,
} from '@testing-library/react';
import {
  iterateFormatted,
  useAsyncIterEffect,
  type IterationResult,
  type IterationResultSet,
} from '../libEntrypoint.js';
import { IteratorChannelTestHelper } from '../utils/IteratorChannelTestHelper.js';

afterEach(() => {
  testingLibraryCleanupAllMountings();
});

describe('`useAsyncIterEffect` hook', () => {
  it(
    gray(
      'When given iterable base deps that yield some values but not given an inner deps array, works correctly'
    ),
    async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const effectResolverFn = vi.fn((..._depVals: any[]) => [effectCb] as const);
      const effectCb = vi.fn(() => destructor);
      const destructor = vi.fn();

      const renderedHook = await act(() =>
        renderHook(() => {
          useAsyncIterEffect(
            [ch1, ch2],
            (
              ...depVals: readonly [
                IterationResult<AsyncIterable<string>>,
                IterationResult<AsyncIterable<string>>,
              ]
            ) => effectResolverFn(...depVals)
          );
        })
      );

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).not.toHaveBeenCalled();

      for (const [i, next] of [
        () => ch1.put('a'),
        () => ch2.put('a'),
        () => renderedHook.rerender(),
        () => ch1.put('b'),
        () => ch2.put('b'),
        () => renderedHook.rerender(),
      ].entries()) {
        await act(next);
        expect(effectCb).toHaveBeenCalledTimes(2 + i);
        expect(destructor).toHaveBeenCalledTimes(1 + i);
      }

      expect(effectResolverFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj('a')],
        [itResultObj('a'), itResultObj('a')],
        [itResultObj('b'), itResultObj('a')],
        [itResultObj('b'), itResultObj('b')],
        [itResultObj('b'), itResultObj('b')],
      ]);
    }
  );

  it(
    gray(
      'When given iterable base deps that yield some values and an empty inner deps array, works correctly'
    ),
    async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const effectResolverFn = vi.fn((..._depVals: any[]) => [effectCb, []] as const);
      const effectCb = vi.fn(() => destructor);
      const destructor = vi.fn();

      const renderedHook = await act(() =>
        renderHook(() => {
          useAsyncIterEffect(
            [ch1, ch2],
            (
              ...depVals: readonly [
                IterationResult<AsyncIterable<string>>,
                IterationResult<AsyncIterable<string>>,
              ]
            ) => effectResolverFn(...depVals)
          );
        })
      );

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).not.toHaveBeenCalled();

      for (const next of [
        () => ch1.put('a'),
        () => ch2.put('a'),
        () => renderedHook.rerender(),
        () => ch1.put('b'),
        () => ch2.put('b'),
        () => renderedHook.rerender(),
      ]) {
        await act(next);
      }

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).not.toHaveBeenCalled();

      expect(effectResolverFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj('a')],
        [itResultObj('a'), itResultObj('a')],
        [itResultObj('b'), itResultObj('a')],
        [itResultObj('b'), itResultObj('b')],
        [itResultObj('b'), itResultObj('b')],
      ]);
    }
  );

  it(
    gray(
      'When given iterable base deps that yield some values and some inner deps, works correctly'
    ),
    async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const effectResolverFn = vi.fn(
        (...depVals: any[]) => [effectCb, depVals.map(next => (next.value ?? '').length)] as const
      );
      const effectCb = vi.fn(() => destructor);
      const destructor = vi.fn();

      await act(() =>
        renderHook(() => {
          useAsyncIterEffect(
            [ch1, ch2],
            (
              ...depVals: readonly [
                IterationResult<AsyncIterable<string>>,
                IterationResult<AsyncIterable<string>>,
              ]
            ) => effectResolverFn(...depVals)
          );
        })
      );

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).not.toHaveBeenCalled();

      await act(() => ch1.put('a'));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      await act(() => ch2.put('a'));
      expect(effectCb).toHaveBeenCalledTimes(3);
      expect(destructor).toHaveBeenCalledTimes(2);

      await act(() => ch1.put('b'));
      expect(effectCb).toHaveBeenCalledTimes(3);
      expect(destructor).toHaveBeenCalledTimes(2);

      await act(() => ch2.put('b'));
      expect(effectCb).toHaveBeenCalledTimes(3);
      expect(destructor).toHaveBeenCalledTimes(2);

      expect(effectResolverFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj('a')],
        [itResultObj('b'), itResultObj('a')],
        [itResultObj('b'), itResultObj('b')],
      ]);
    }
  );

  it(
    gray(
      'When given base deps of mixed yielding iterables + plain values and some inner deps, works correctly'
    ),
    async () => {
      const ch = new IteratorChannelTestHelper<string>();
      const effectResolverFn = vi.fn(
        (...depVals: any[]) => [effectCb, depVals.map(next => (next.value ?? '').length)] as const
      );
      const effectCb = vi.fn(() => destructor);
      const destructor = vi.fn();

      const renderedHook = await act(() =>
        renderHook(
          props => {
            useAsyncIterEffect(
              props.baseDeps,
              (...depVals: IterationResultSet<readonly [AsyncIterable<string>, string]>) =>
                effectResolverFn(...depVals)
            );
          },
          { initialProps: { baseDeps: [ch, ''] as [AsyncIterable<string>, string] } }
        )
      );

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).not.toHaveBeenCalled();

      await act(() => ch.put('a'));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      await act(() => renderedHook.rerender({ baseDeps: [ch, 'a'] }));
      expect(effectCb).toHaveBeenCalledTimes(3);
      expect(destructor).toHaveBeenCalledTimes(2);

      await act(() => ch.put('b'));
      expect(effectCb).toHaveBeenCalledTimes(3);
      expect(destructor).toHaveBeenCalledTimes(2);

      await act(() => renderedHook.rerender({ baseDeps: [ch, 'b'] }));
      expect(effectCb).toHaveBeenCalledTimes(3);
      expect(destructor).toHaveBeenCalledTimes(2);

      expect(effectResolverFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj('')],
        [itResultObj('a'), itResultObj('')],
        [itResultObj('a'), itResultObj('a')],
        [itResultObj('b'), itResultObj('a')],
        [itResultObj('b'), itResultObj('b')],
      ]);
    }
  );

  it(
    gray(
      'When updated consecutively with plain value base deps and some inner deps, works correctly'
    ),
    async () => {
      const effectResolverFn = vi.fn(
        (...depVals: any[]) => [effectCb, depVals.map(next => (next.value ?? '').length)] as const
      );
      const effectCb = vi.fn(() => destructor);
      const destructor = vi.fn();

      const renderedHook = await act(() =>
        renderHook(
          props => {
            useAsyncIterEffect(
              props.baseDeps,
              (...depVals: IterationResult<string | null | undefined>[]) =>
                effectResolverFn(...depVals)
            );
          },
          { initialProps: { baseDeps: ['a', 'b'] as (string | null | undefined)[] } }
        )
      );

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).toHaveBeenCalledTimes(0);

      await act(() => renderedHook.rerender({ baseDeps: ['a', 'c'] }));
      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).toHaveBeenCalledTimes(0);

      await act(() => renderedHook.rerender({ baseDeps: ['b', 'd'] }));
      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).toHaveBeenCalledTimes(0);

      await act(() => renderedHook.rerender({ baseDeps: [undefined, null] }));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      expect(effectResolverFn.mock.calls).toStrictEqual([
        [itResultObj('a'), itResultObj('b')],
        [itResultObj('a'), itResultObj('c')],
        [itResultObj('b'), itResultObj('d')],
        [itResultObj(undefined), itResultObj(null)],
      ]);
    }
  );

  it(
    gray(
      'When updated consecutively with new iterable base deps and some inner deps, works correctly'
    ),
    async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const ch3 = new IteratorChannelTestHelper<string>();
      const effectResolverFn = vi.fn(
        (...depVals: any[]) => [effectCb, depVals.map(next => (next.value ?? '').length)] as const
      );
      const effectCb = vi.fn(() => destructor);
      const destructor = vi.fn();

      const renderedHook = await act(() =>
        renderHook(
          props => {
            useAsyncIterEffect(
              props.baseDeps,
              (
                ...depVals: IterationResultSet<
                  readonly [AsyncIterable<string>, AsyncIterable<string>]
                >
              ) => effectResolverFn(...depVals)
            );
          },
          { initialProps: { baseDeps: [ch1, ch2] as const } }
        )
      );

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).not.toHaveBeenCalled();

      await act(() => ch1.put('a'));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      await act(() => ch2.put('b'));
      expect(effectCb).toHaveBeenCalledTimes(3);
      expect(destructor).toHaveBeenCalledTimes(2);

      await act(() => renderedHook.rerender({ baseDeps: [ch1, ch3] }));
      expect(effectCb).toHaveBeenCalledTimes(3);
      expect(destructor).toHaveBeenCalledTimes(2);

      await act(() => ch3.put('c'));
      expect(effectCb).toHaveBeenCalledTimes(3);
      expect(destructor).toHaveBeenCalledTimes(2);

      expect(effectResolverFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj('b')],
        [itResultObj('a'), itResultObj('b', true)],
        [itResultObj('a'), itResultObj('c')],
      ]);
    }
  );

  it(gray('When given iterable base deps that complete, works correctly'), async () => {
    const ch1 = new IteratorChannelTestHelper<string>();
    const ch2 = new IteratorChannelTestHelper<string>();
    const effectResolverFn = vi.fn(
      (...depVals: any[]) => [effectCb, depVals.map(next => (next.value ?? '').length)] as const
    );
    const effectCb = vi.fn(() => destructor);
    const destructor = vi.fn();

    await act(() =>
      renderHook(() => {
        useAsyncIterEffect(
          [ch1, ch2],
          (
            ...depVals: IterationResultSet<readonly [AsyncIterable<string>, AsyncIterable<string>]>
          ) => effectResolverFn(...depVals)
        );
      })
    );

    expect(effectCb).toHaveBeenCalledTimes(1);
    expect(destructor).not.toHaveBeenCalled();

    await act(() => ch1.complete());
    expect(effectCb).toHaveBeenCalledTimes(1);
    expect(destructor).toHaveBeenCalledTimes(0);

    await act(() => ch2.put('a'));
    expect(effectCb).toHaveBeenCalledTimes(2);
    expect(destructor).toHaveBeenCalledTimes(1);

    await act(() => ch2.complete());
    expect(effectCb).toHaveBeenCalledTimes(2);
    expect(destructor).toHaveBeenCalledTimes(1);

    expect(effectResolverFn.mock.calls).toStrictEqual([
      [itResultObj(undefined, true), itResultObj(undefined, true)],
      [itResultObj(undefined, false, true), itResultObj(undefined, true)],
      [itResultObj(undefined, false, true), itResultObj('a')],
      [itResultObj(undefined, false, true), itResultObj('a', false, true)],
    ]);
  });

  it(gray('When given iterable base deps that error out, works correctly'), async () => {
    const ch1 = new IteratorChannelTestHelper<string>();
    const ch2 = new IteratorChannelTestHelper<string>();
    const effectResolverFn = vi.fn(
      (...depVals: any[]) => [effectCb, depVals.map(next => (next.value ?? '').length)] as const
    );
    const effectCb = vi.fn(() => destructor);
    const destructor = vi.fn();

    await act(() =>
      renderHook(() => {
        useAsyncIterEffect(
          [ch1, ch2],
          (
            ...depVals: IterationResultSet<readonly [AsyncIterable<string>, AsyncIterable<string>]>
          ) => effectResolverFn(...depVals)
        );
      })
    );

    expect(effectCb).toHaveBeenCalledTimes(1);
    expect(destructor).toHaveBeenCalledTimes(0);

    await act(() => ch1.error(simulatedError));
    expect(effectCb).toHaveBeenCalledTimes(1);
    expect(destructor).toHaveBeenCalledTimes(0);

    await act(() => ch2.put('a'));
    expect(effectCb).toHaveBeenCalledTimes(2);
    expect(destructor).toHaveBeenCalledTimes(1);

    await act(() => ch2.error(simulatedError));
    expect(effectCb).toHaveBeenCalledTimes(2);
    expect(destructor).toHaveBeenCalledTimes(1);

    expect(effectResolverFn.mock.calls).toStrictEqual([
      [itResultObj(undefined, true), itResultObj(undefined, true)],
      [itResultObj(undefined, false, true, simulatedError), itResultObj(undefined, true)],
      [itResultObj(undefined, false, true, simulatedError), itResultObj('a')],
      [
        itResultObj(undefined, false, true, simulatedError),
        itResultObj('a', false, true, simulatedError),
      ],
    ]);
  });

  it(
    gray(
      "When given iterable base deps yield the same value consecutively, the inner deps are not re-computed or re-checked and the effect won't ever re-run, and it works correctly"
    ),
    async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const effectResolverFn = vi.fn(
        (...depVals: any[]) => [effectCb, depVals.map(next => (next.value ?? '').length)] as const
      );
      const effectCb = vi.fn(() => destructor);
      const destructor = vi.fn();

      await act(() =>
        renderHook(() => {
          useAsyncIterEffect(
            [ch1, ch2],
            (
              ...depVals: IterationResultSet<
                readonly [AsyncIterable<string>, AsyncIterable<string>]
              >
            ) => effectResolverFn(...depVals)
          );
        })
      );

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).toHaveBeenCalledTimes(0);

      for (let i = 0; i < 3; ++i) {
        await act(() => ch1.put('a'));
        expect(effectCb).toHaveBeenCalledTimes(2);
        expect(destructor).toHaveBeenCalledTimes(1);
      }
      for (let i = 0; i < 3; ++i) {
        await act(() => ch2.put('a'));
        expect(effectCb).toHaveBeenCalledTimes(3);
        expect(destructor).toHaveBeenCalledTimes(2);
      }
      for (let i = 0; i < 3; ++i) {
        await act(() => ch1.put('a'));
        await act(() => ch2.put('a'));
        expect(effectCb).toHaveBeenCalledTimes(3);
        expect(destructor).toHaveBeenCalledTimes(2);
      }

      expect(effectResolverFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj('a')],
      ]);
    }
  );

  it(
    gray('When updated consecutively with formatted iterable base deps, works correctly'),
    async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const effectResolverFn = vi.fn(
        (...depVals: any[]) =>
          [effectCb, depVals.map(next => next.value?.formatted?.length ?? 0)] as const
      );
      const effectCb = vi.fn(() => destructor);
      const destructor = vi.fn();

      const renderedHook = await act(() =>
        renderHook(
          props => {
            useAsyncIterEffect(
              props.baseDeps,
              (...depVals: IterationResultSet<readonly AsyncIterable<{ formatted: string }>[]>) =>
                effectResolverFn(...depVals)
            );
          },
          {
            initialProps: {
              baseDeps: [ch1, ch2].map(ch =>
                iterateFormatted(ch, val => ({ formatted: `${val}_format_1` }))
              ),
            },
          }
        )
      );

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).toHaveBeenCalledTimes(0);

      await act(() => ch1.put('a'));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      await act(() =>
        renderedHook.rerender({
          baseDeps: [ch1, ch2].map(ch =>
            iterateFormatted(ch, val => ({ formatted: `${val}_format_2` }))
          ),
        })
      );
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      await act(() => ch2.put('b'));
      expect(effectCb).toHaveBeenCalledTimes(3);
      expect(destructor).toHaveBeenCalledTimes(2);

      expect(effectResolverFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj({ formatted: 'a_format_1' }), itResultObj(undefined, true)],
        [itResultObj({ formatted: 'a_format_1' }), itResultObj(undefined, true)],
        [itResultObj({ formatted: 'a_format_1' }), itResultObj({ formatted: 'b_format_2' })],
      ]);
    }
  );

  it(
    gray(
      'When given a formatted iterable base dep yielding `undefined`s or `null`s that wraps a source iter yielding non-null values, the `undefined`s and `null` yieldings are not swallowed and processed as expected (https://github.com/shtaif/react-async-iterators/pull/32)'
    ),
    async () => {
      const ch = new IteratorChannelTestHelper<string>();
      const effectResolverFn = vi.fn((...depVals: any[]) => [effectCb, depVals] as const);
      const effectCb = vi.fn(() => destructor);
      const destructor = vi.fn();

      const renderedHook = await act(() =>
        renderHook(
          props => {
            useAsyncIterEffect(
              [iterateFormatted(ch, () => props.formatTo)],
              (...depVals: IterationResultSet<readonly [AsyncIterable<null | undefined>]>) =>
                effectResolverFn(...depVals)
            );
          },
          { initialProps: { formatTo: undefined as null | undefined } }
        )
      );

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).toHaveBeenCalledTimes(0);

      await act(() => renderedHook.rerender({ formatTo: null }));
      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).toHaveBeenCalledTimes(0);

      await act(() => ch.put('a'));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      await act(() => renderedHook.rerender({ formatTo: undefined }));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      await act(() => ch.put('b'));
      expect(effectCb).toHaveBeenCalledTimes(3);
      expect(destructor).toHaveBeenCalledTimes(2);

      expect(effectResolverFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true)],
        [itResultObj(undefined, true)],
        [itResultObj(null)],
        [itResultObj(null)],
        [itResultObj(undefined)],
      ]);
    }
  );

  it(
    gray(
      'When given iterable base deps with a `.value.current` property at any point, uses that as the current value and skips the pending stage'
    ),

    async () => {
      const [ch1, ch2] = [
        Object.assign(new IteratorChannelTestHelper<string>(), { value: { current: 'a_current' } }),
        Object.assign(new IteratorChannelTestHelper<string>(), { value: { current: 'b_current' } }),
      ];
      const effectResolverFn = vi.fn(
        (...depVals: any[]) => [effectCb, depVals.map(next => (next.value ?? '').length)] as const
      );
      const effectCb = vi.fn(() => destructor);
      const destructor = vi.fn();

      const renderedHook = await act(() =>
        renderHook(
          props => {
            useAsyncIterEffect(
              props.baseDeps,
              (
                ...depVals: IterationResultSet<
                  readonly [AsyncIterable<string>, AsyncIterable<string>]
                >
              ) => effectResolverFn(...depVals)
            );
          },
          {
            initialProps: {
              baseDeps: [ch1, ch2] as [AsyncIterable<string>, AsyncIterable<string>],
            },
          }
        )
      );

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).toHaveBeenCalledTimes(0);

      await act(() => ch1.put('a'));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      await act(() => renderedHook.rerender({ baseDeps: [ch1, ch2] }));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      await act(() => ch2.put('b'));
      expect(effectCb).toHaveBeenCalledTimes(3);
      expect(destructor).toHaveBeenCalledTimes(2);

      expect(effectResolverFn.mock.calls).toStrictEqual([
        [itResultObj('a_current'), itResultObj('b_current')],
        [itResultObj('a'), itResultObj('b_current')],
        [itResultObj('a'), itResultObj('b_current')],
        [itResultObj('a'), itResultObj('b')],
      ]);
    }
  );

  it(
    gray(
      'When given a new iterable base dep whose first yielded value is the same as the value it had during the "pending" state (carried over from the prev iterable\'s last yield), the inner deps DO re-compute and check as normally would'
    ),
    async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const effectResolverFn = vi.fn(
        (...depVals: any[]) => [effectCb, depVals.map(next => (next.value ?? '').length)] as const
      );
      const effectCb = vi.fn(() => destructor);
      const destructor = vi.fn();

      const renderedHook = await act(() =>
        renderHook(
          props => {
            useAsyncIterEffect(
              [props.iter],
              (...depVals: IterationResultSet<readonly [AsyncIterable<string>]>) =>
                effectResolverFn(...depVals)
            );
          },
          { initialProps: { iter: ch1 } }
        )
      );

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).toHaveBeenCalledTimes(0);

      await act(() => ch1.put('a'));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      await act(() => renderedHook.rerender({ iter: ch2 }));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      await act(() => ch2.put('a'));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      expect(effectResolverFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true)],
        [itResultObj('a')],
        [itResultObj('a', true)],
        [itResultObj('a')],
      ]);
    }
  );

  it(
    gray('When unmounted, closes all active iterable base deps currently being held'),
    async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const effectResolverFn = vi.fn(
        (...depVals: any[]) => [effectCb, depVals.map(next => (next.value ?? '').length)] as const
      );
      const effectCb = vi.fn(() => destructor);
      const destructor = vi.fn();

      const renderedHook = await act(() =>
        renderHook(
          props => {
            useAsyncIterEffect(
              props.baseDeps,
              (
                ...depVals: IterationResultSet<
                  readonly [AsyncIterable<string>, AsyncIterable<string>]
                >
              ) => effectResolverFn(...depVals)
            );
          },
          {
            initialProps: {
              baseDeps: [ch1, ch2] as [AsyncIterable<string>, AsyncIterable<string>],
            },
          }
        )
      );

      expect(effectCb).toHaveBeenCalledTimes(1);
      expect(destructor).toHaveBeenCalledTimes(0);
      for (const ch of [ch1, ch2]) {
        expect(ch.returnSpy).not.toHaveBeenCalledOnce();
      }

      await act(() => ch1.put('a'));
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(1);

      await act(() => renderedHook.unmount());
      expect(effectCb).toHaveBeenCalledTimes(2);
      expect(destructor).toHaveBeenCalledTimes(2);
      for (const ch of [ch1, ch2]) {
        expect(ch.returnSpy).toHaveBeenCalledOnce();
      }
    }
  );
});

function itResultObj(
  value: unknown = undefined,
  pendingFirst: boolean = false,
  done: boolean = false,
  error: unknown = undefined
) {
  return { value, pendingFirst, done, error };
}

const simulatedError = new Error('🚨 Simulated Error 🚨');
