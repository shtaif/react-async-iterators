import { it, describe, expect, afterEach, vi, type Mock } from 'vitest';
import { gray } from 'colorette';
import { cleanup as cleanupMountedReactTrees, act, renderHook } from '@testing-library/react';
import { iterateFormatted, type IterationResult, useAsyncIterEffect } from '../libEntrypoint.js';
import { IteratorChannelTestHelper } from '../utils/IteratorChannelTestHelper.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`useAsyncIterEffect` hook', () => {
  it(gray('When given iterable deps that yield some values, works correctly'), async () => {
    const ch1 = new IteratorChannelTestHelper<string>();
    const ch2 = new IteratorChannelTestHelper<string>();
    const destructor = vi.fn();
    const effectFn = vi.fn(() => destructor) as Mock<
      (
        ...args: [IterationResult<AsyncIterable<string>>, IterationResult<AsyncIterable<string>>]
      ) => void
    >;

    await act(() =>
      renderHook(() => {
        useAsyncIterEffect(effectFn, [ch1, ch2]);
      })
    );

    expect(destructor).not.toHaveBeenCalled();

    for (const [i, next] of [
      () => ch1.put('a'),
      () => ch2.put('a'),
      () => ch1.put('b'),
      () => ch2.put('b'),
    ].entries()) {
      await act(next);
      expect(destructor).toHaveBeenCalledTimes(i + 1);
    }

    expect(effectFn.mock.calls).toStrictEqual([
      [itResultObj(undefined, true), itResultObj(undefined, true)],
      [itResultObj('a'), itResultObj(undefined, true)],
      [itResultObj('a'), itResultObj('a')],
      [itResultObj('b'), itResultObj('a')],
      [itResultObj('b'), itResultObj('b')],
    ]);
  });

  it(
    gray('When given iterable deps that yield the same values consecutively, works correctly'),
    async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const destructor = vi.fn();
      const effectFn = vi.fn(() => destructor) as Mock<
        (
          ...args: [IterationResult<AsyncIterable<string>>, IterationResult<AsyncIterable<string>>]
        ) => void
      >;

      await act(() =>
        renderHook(() => {
          useAsyncIterEffect(effectFn, [ch1, ch2]);
        })
      );

      expect(destructor).not.toHaveBeenCalled();

      for (const [next, destructorCallCount] of [
        [() => ch1.put('a'), 1],
        [() => ch1.put('a'), 1],
        [() => ch2.put('b'), 2],
        [() => ch2.put('b'), 2],
      ] as const) {
        await act(next);
        expect(destructor).toHaveBeenCalledTimes(destructorCallCount);
      }

      expect(effectFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj('b')],
      ]);
    }
  );

  it(gray('When updated consecutively with plain value deps, works correctly'), async () => {
    const destructor = vi.fn();
    const effectFn = vi.fn(() => destructor) as Mock<
      (
        ...args: [
          IterationResult<string | null | undefined>,
          IterationResult<string | null | undefined>,
        ]
      ) => void
    >;

    const renderedHook = await act(() =>
      renderHook(
        ({ values }) => {
          useAsyncIterEffect(effectFn, values);
        },
        {
          initialProps: { values: ['a', 'b'] as (string | null | undefined)[] },
        }
      )
    );

    expect(destructor).not.toHaveBeenCalled();

    for (const [i, next] of [
      () => renderedHook.rerender({ values: ['a', 'c'] }),
      () => renderedHook.rerender({ values: ['b', 'd'] }),
      () => renderedHook.rerender({ values: [undefined, null] }),
    ].entries()) {
      await act(next);
      expect(destructor).toHaveBeenCalledTimes(i + 1);
    }

    expect(effectFn.mock.calls).toStrictEqual([
      [itResultObj('a'), itResultObj('b')],
      [itResultObj('a'), itResultObj('c')],
      [itResultObj('b'), itResultObj('d')],
      [itResultObj(undefined), itResultObj(null)],
    ]);
  });

  it(
    gray(
      'When updated consecutively with the same plain value deps, does not re-run effect and works correctly'
    ),
    async () => {
      const destructor = vi.fn();
      const effectFn = vi.fn(() => destructor) as Mock<
        (
          ...args: [
            IterationResult<string | null | undefined>,
            IterationResult<string | null | undefined>,
          ]
        ) => void
      >;

      const renderedHook = await act(() =>
        renderHook(
          ({ values }) => {
            useAsyncIterEffect(effectFn, values);
          },
          { initialProps: { values: ['a', 'b'] as (string | null | undefined)[] } }
        )
      );

      expect(destructor).not.toHaveBeenCalled();

      for (const [next, destructorCallCount] of [
        [() => renderedHook.rerender({ values: ['a', 'b'] }), 0],
        [() => renderedHook.rerender({ values: ['a', 'c'] }), 1],
        [() => renderedHook.rerender({ values: ['a', 'c'] }), 1],
        [() => renderedHook.rerender({ values: ['b', 'd'] }), 2],
        [() => renderedHook.rerender({ values: ['b', 'd'] }), 2],
      ] as const) {
        await act(next);
        expect(destructor).toHaveBeenCalledTimes(destructorCallCount);
      }

      expect(effectFn.mock.calls).toStrictEqual([
        [itResultObj('a'), itResultObj('b')],
        [itResultObj('a'), itResultObj('c')],
        [itResultObj('b'), itResultObj('d')],
      ]);
    }
  );

  it(
    gray(
      'When updated consecutively with the same iterable deps, does not re-run effect and works correctly'
    ),
    async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const destructor = vi.fn();
      const effectFn = vi.fn(() => destructor) as Mock<
        (
          ...args: [IterationResult<AsyncIterable<string>>, IterationResult<AsyncIterable<string>>]
        ) => void
      >;

      const renderedHook = await act(() =>
        renderHook(() => {
          useAsyncIterEffect(effectFn, [ch1, ch2]);
        })
      );

      expect(destructor).not.toHaveBeenCalled();

      for (const [next, destructorCallCount] of [
        [() => renderedHook.rerender(), 0],
        [() => ch1.put('a'), 1],
        [() => renderedHook.rerender(), 1],
        [() => ch2.put('b'), 2],
        [() => renderedHook.rerender(), 2],
      ] as const) {
        await act(next);
        expect(destructor).toHaveBeenCalledTimes(destructorCallCount);
      }

      expect(effectFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj('b')],
      ]);
    }
  );

  it(
    gray(
      "When updated consecutively with changed iterable deps, re-runs effect with the new iterables' initial state and works correctly"
    ),
    async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const ch3 = new IteratorChannelTestHelper<string>();
      const destructor = vi.fn();
      const effectFn = vi.fn(() => destructor) as Mock<
        (
          ...args: [IterationResult<AsyncIterable<string>>, IterationResult<AsyncIterable<string>>]
        ) => void
      >;

      const renderedHook = await act(() =>
        renderHook(
          ({ iters }) => {
            useAsyncIterEffect(effectFn, iters);
          },
          { initialProps: { iters: [ch1, ch2] } }
        )
      );

      expect(destructor).not.toHaveBeenCalled();
      expect(ch2.returnSpy).not.toHaveBeenCalled();

      for (const [i, next] of [
        () => ch1.put('a'),
        () => ch2.put('b'),
        () => renderedHook.rerender({ iters: [ch1, ch3] }),
        () => ch3.put('c'),
      ].entries()) {
        await act(next);
        expect(destructor).toHaveBeenCalledTimes(i + 1);
      }

      expect(ch2.returnSpy).toHaveBeenCalledOnce();

      expect(effectFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj('b')],
        [itResultObj('a'), itResultObj('b', true)],
        [itResultObj('a'), itResultObj('c')],
      ]);
    }
  );

  it(gray('When given iterable deps that complete, works correctly'), async () => {
    const ch1 = new IteratorChannelTestHelper<string>();
    const ch2 = new IteratorChannelTestHelper<string>();
    const destructor = vi.fn();
    const effectFn = vi.fn(() => destructor) as Mock<
      (
        ...args: [IterationResult<AsyncIterable<string>>, IterationResult<AsyncIterable<string>>]
      ) => void
    >;

    await act(() =>
      renderHook(() => {
        useAsyncIterEffect(effectFn, [ch1, ch2]);
      })
    );

    expect(destructor).not.toHaveBeenCalled();

    for (const [next, destructorCallCount] of [
      [() => ch1.complete(), 1],
      [() => ch2.put('a'), 2],
      [() => ch2.complete(), 3],
    ] as const) {
      await act(next);
      expect(destructor).toHaveBeenCalledTimes(destructorCallCount);
    }

    expect(effectFn.mock.calls).toStrictEqual([
      [itResultObj(undefined, true), itResultObj(undefined, true)],
      [itResultObj(undefined, false, true), itResultObj(undefined, true)],
      [itResultObj(undefined, false, true), itResultObj('a')],
      [itResultObj(undefined, false, true), itResultObj('a', false, true)],
    ]);
  });

  it(gray('when given iterable deps that error out, works correctly'), async () => {
    const ch1 = new IteratorChannelTestHelper<string>();
    const ch2 = new IteratorChannelTestHelper<string>();
    const destructor = vi.fn();
    const effectFn = vi.fn(() => destructor) as Mock<
      (
        ...args: [IterationResult<AsyncIterable<string>>, IterationResult<AsyncIterable<string>>]
      ) => void
    >;

    await act(() =>
      renderHook(() => {
        useAsyncIterEffect(effectFn, [ch1, ch2]);
      })
    );

    expect(destructor).not.toHaveBeenCalled();

    for (const [next, destructorCallCount] of [
      [() => ch1.error(simulatedError), 1],
      [() => ch2.put('a'), 2],
      [() => ch2.error(simulatedError), 3],
    ] as const) {
      await act(next);
      expect(destructor).toHaveBeenCalledTimes(destructorCallCount);
    }

    expect(effectFn.mock.calls).toStrictEqual([
      [itResultObj(undefined, true), itResultObj(undefined, true)],
      [itResultObj(undefined, false, true, simulatedError), itResultObj(undefined, true)],
      [itResultObj(undefined, false, true, simulatedError), itResultObj('a')],
      [
        itResultObj(undefined, false, true, simulatedError),
        itResultObj('a', false, true, simulatedError),
      ],
    ]);
  });

  it(gray('When updated consecutively with formatted iterable deps, works correctly'), async () => {
    const ch1 = new IteratorChannelTestHelper<string>();
    const ch2 = new IteratorChannelTestHelper<string>();
    const destructor = vi.fn();
    const effectFn = vi.fn(() => destructor) as Mock<
      (
        ...args: [IterationResult<AsyncIterable<string>>, IterationResult<AsyncIterable<string>>]
      ) => void
    >;

    const renderedHook = await act(() =>
      renderHook(
        props => {
          useAsyncIterEffect(effectFn, props.values);
        },
        {
          initialProps: {
            values: [ch1, ch2].map(ch => iterateFormatted(ch, val => `${val}_format_1`)),
          },
        }
      )
    );

    expect(destructor).not.toHaveBeenCalled();

    for (const [next, destructorCallCount] of [
      [() => ch1.put('a'), 1],
      [
        () =>
          renderedHook.rerender({
            values: [ch1, ch2].map(ch => iterateFormatted(ch, val => `${val}_format_2`)),
          }),
        1,
      ],
      [() => ch2.put('b'), 2],
    ] as const) {
      await act(next);
      expect(destructor).toHaveBeenCalledTimes(destructorCallCount);
    }

    expect(effectFn.mock.calls).toStrictEqual([
      [itResultObj(undefined, true), itResultObj(undefined, true)],
      [itResultObj('a_format_1'), itResultObj(undefined, true)],
      [itResultObj('a_format_1'), itResultObj('b_format_2')],
    ]);
  });

  it(
    gray(
      'When given an iterable with a `.value.current` property at any point, uses that as the current value and skips the pending stage'
    ),

    async () => {
      const [ch1, ch2] = [
        Object.assign(new IteratorChannelTestHelper<string>(), { value: { current: 'a_current' } }),
        Object.assign(new IteratorChannelTestHelper<string>(), { value: { current: 'b_current' } }),
      ];
      const destructor = vi.fn();
      const effectFn = vi.fn(() => destructor) as Mock<
        (
          ...args: [IterationResult<AsyncIterable<string>>, IterationResult<AsyncIterable<string>>]
        ) => void
      >;

      const renderedHook = await act(() =>
        renderHook(
          props => {
            useAsyncIterEffect(effectFn, props.inputs);
          },
          { initialProps: { inputs: [ch1, ch2] } }
        )
      );

      expect(destructor).not.toHaveBeenCalled();

      for (const [next, destructorCallCount] of [
        [() => ch1.put('a'), 1],
        [() => renderedHook.rerender({ inputs: [ch1, ch2] }), 1],
        [() => ch2.put('b'), 2],
      ] as const) {
        await act(next);
        expect(destructor).toHaveBeenCalledTimes(destructorCallCount);
      }

      expect(effectFn.mock.calls).toStrictEqual([
        [itResultObj('a_current'), itResultObj('b_current')],
        [itResultObj('a'), itResultObj('b_current')],
        [itResultObj('a'), itResultObj('b')],
      ]);
    }
  );

  it(gray('When unmounted, closes all active iterable deps it was holding'), async () => {
    const ch1 = new IteratorChannelTestHelper<string>();
    const ch2 = new IteratorChannelTestHelper<string>();
    const destructor = vi.fn();
    const effectFn = vi.fn(() => destructor) as Mock<
      (
        ...args: [IterationResult<AsyncIterable<string>>, IterationResult<AsyncIterable<string>>]
      ) => void
    >;

    const renderedHook = await act(() =>
      renderHook(
        props => {
          useAsyncIterEffect(effectFn, props.values);
        },
        {
          initialProps: {
            values: [ch1, ch2].map(ch => iterateFormatted(ch, val => `${val}_format_1`)),
          },
        }
      )
    );

    expect(destructor).not.toHaveBeenCalled();
    expect(ch1.returnSpy).not.toHaveBeenCalledOnce();
    expect(ch2.returnSpy).not.toHaveBeenCalledOnce();

    for (const [next, destructorCallCount] of [
      [() => ch1.put('a'), 1],
      [() => renderedHook.unmount(), 2],
    ] as const) {
      await act(next);
      expect(destructor).toHaveBeenCalledTimes(destructorCallCount);
    }

    expect(ch1.returnSpy).toHaveBeenCalledOnce();
    expect(ch2.returnSpy).toHaveBeenCalledOnce();
  });

  it(
    gray(
      'When given iterable\'s first yield is the same as the one "pending" state to the previous value, the effect IS called'
    ),
    async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const destructor = vi.fn();
      const effectFn = vi.fn(() => destructor) as Mock<
        (...args: [IterationResult<AsyncIterable<string>>]) => void
      >;

      const renderedHook = await act(() =>
        renderHook(
          props => {
            useAsyncIterEffect(effectFn, [props.iter]);
          },
          { initialProps: { iter: ch1 } }
        )
      );

      for (const next of [
        () => ch1.put('a'),
        () => renderedHook.rerender({ iter: ch2 }),
        () => ch2.put('a'),
      ]) {
        await act(next);
      }

      expect(effectFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true)],
        [itResultObj('a')],
        [itResultObj('a', true)],
        [itResultObj('a')],
      ]);
    }
  );

  it(
    gray(
      'When given a formatted iterable dep yielding `undefined`s or `null`s that wraps a source iter yielding non-null values, runs the effect function with the `undefined`s and `null`s as expected (https://github.com/shtaif/react-async-iterators/pull/32)'
    ),
    async () => {
      const ch = new IteratorChannelTestHelper<string>();
      const destructor = vi.fn();
      const effectFn = vi.fn(() => destructor) as Mock<
        (...args: [IterationResult<AsyncIterable<string | null | undefined>>]) => void
      >;

      const renderedHook = await act(() =>
        renderHook(
          props => {
            useAsyncIterEffect(effectFn, [iterateFormatted(ch, () => props.formatTo)]);
          },
          { initialProps: { formatTo: undefined as null | undefined } }
        )
      );

      await act(() => (renderedHook.rerender({ formatTo: null }), ch.put('a')));
      await act(() => (renderedHook.rerender({ formatTo: undefined }), ch.put('b')));

      expect(effectFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true)],
        [itResultObj(null)],
        [itResultObj(undefined)],
      ]);
    }
  );

  describe('Providing the dep mapping function argument', () => {
    it(gray('When given iterable deps that yield some values, works correctly'), async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const destructor = vi.fn();
      const effectFn = vi.fn(() => destructor) as Mock<
        (
          ...args: [IterationResult<AsyncIterable<string>>, IterationResult<AsyncIterable<string>>]
        ) => void
      >;
      const commonMockDepMappingFn = createCommonMockDepMappingFn();

      await act(() =>
        renderHook(() => {
          useAsyncIterEffect(effectFn, [ch1, ch2], commonMockDepMappingFn);
        })
      );

      expect(destructor).not.toHaveBeenCalled();

      for (const [next, destructorCallCount] of [
        [() => ch1.put('a'), 1],
        [() => ch2.put('a'), 2],
        [() => ch1.put('b'), 2],
        [() => ch2.put('b'), 2],
      ] as const) {
        await act(next);
        expect(destructor).toHaveBeenCalledTimes(destructorCallCount);
      }

      expect(commonMockDepMappingFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj('a')],
        [itResultObj('b'), itResultObj('a')],
        [itResultObj('b'), itResultObj('b')],
      ]);
      expect(effectFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj(undefined, true)],
        [itResultObj('a'), itResultObj('a')],
      ]);
    });

    it(
      gray('when given mixed yielding iterable and plain value deps, works correctly'),
      async () => {
        const ch = new IteratorChannelTestHelper<string>();
        const destructor = vi.fn();
        const effectFn = vi.fn(() => destructor) as Mock<
          (
            ...args: [
              IterationResult<AsyncIterable<string>>,
              IterationResult<AsyncIterable<string>>,
            ]
          ) => void
        >;
        const commonMockDepMappingFn = createCommonMockDepMappingFn();

        const renderedHook = await act(() =>
          renderHook(
            props => {
              useAsyncIterEffect(effectFn, props.inputs, commonMockDepMappingFn);
            },
            { initialProps: { inputs: [ch, 'a'] } }
          )
        );

        expect(destructor).not.toHaveBeenCalled();

        for (const [next, destructorCallCount] of [
          [() => ch.put('a'), 1],
          [() => renderedHook.rerender({ inputs: [ch, 'b'] }), 1],
        ] as const) {
          await act(next);
          expect(destructor).toHaveBeenCalledTimes(destructorCallCount);
        }

        expect(commonMockDepMappingFn.mock.calls).toStrictEqual([
          [itResultObj(undefined, true), itResultObj('a')],
          [itResultObj('a'), itResultObj('a')],
          [itResultObj('a'), itResultObj('b')],
        ]);
        expect(effectFn.mock.calls).toStrictEqual([
          [itResultObj(undefined, true), itResultObj('a')],
          [itResultObj('a'), itResultObj('a')],
        ]);
      }
    );

    it(
      gray(
        "When updated consecutively with changed iterable deps, re-runs effect with the new iterables' initial state and works correctly"
      ),
      async () => {
        const ch1 = new IteratorChannelTestHelper<string>();
        const ch2 = new IteratorChannelTestHelper<string>();
        const ch3 = new IteratorChannelTestHelper<string>();
        const destructor = vi.fn();
        const effectFn = vi.fn(() => destructor) as Mock<
          (
            ...args: [
              IterationResult<AsyncIterable<string>>,
              IterationResult<AsyncIterable<string>>,
            ]
          ) => void
        >;
        const commonMockDepMappingFn = createCommonMockDepMappingFn();

        const renderedHook = await act(() =>
          renderHook(
            ({ iters }) => {
              useAsyncIterEffect(effectFn, iters, commonMockDepMappingFn);
            },
            { initialProps: { iters: [ch1, ch2] } }
          )
        );

        expect(destructor).not.toHaveBeenCalled();
        expect(ch2.returnSpy).not.toHaveBeenCalled();

        for (const [next, destructorCallCount] of [
          [() => ch1.put('a'), 1],
          [() => ch2.put('b'), 2],
          [() => renderedHook.rerender({ iters: [ch1, ch3] }), 2],
          [() => ch3.put('c'), 2],
        ] as const) {
          await act(next);
          expect(destructor).toHaveBeenCalledTimes(destructorCallCount);
        }

        expect(ch2.returnSpy).toHaveBeenCalledOnce();

        expect(commonMockDepMappingFn.mock.calls).toStrictEqual([
          [itResultObj(undefined, true), itResultObj(undefined, true)],
          [itResultObj('a'), itResultObj(undefined, true)],
          [itResultObj('a'), itResultObj('b')],
          [itResultObj('a'), itResultObj('b', true)],
          [itResultObj('a'), itResultObj('c')],
        ]);
        expect(effectFn.mock.calls).toStrictEqual([
          [itResultObj(undefined, true), itResultObj(undefined, true)],
          [itResultObj('a'), itResultObj(undefined, true)],
          [itResultObj('a'), itResultObj('b')],
        ]);
      }
    );

    it(gray('When given iterable deps that complete and error out, works correctly'), async () => {
      const ch1 = new IteratorChannelTestHelper<string>();
      const ch2 = new IteratorChannelTestHelper<string>();
      const destructor = vi.fn();
      const effectFn = vi.fn(() => destructor) as Mock<
        (
          ...args: [IterationResult<AsyncIterable<string>>, IterationResult<AsyncIterable<string>>]
        ) => void
      >;
      const commonMockDepMappingFn = createCommonMockDepMappingFn();

      await act(() =>
        renderHook(() => {
          useAsyncIterEffect(effectFn, [ch1, ch2], commonMockDepMappingFn);
        })
      );

      expect(destructor).not.toHaveBeenCalled();

      for (const [next, destructorCallCount] of [
        [() => ch1.complete(), 0],
        [() => ch2.put('a'), 1],
        [() => ch2.put('b'), 1],
        [() => ch2.error(simulatedError), 1],
      ] as const) {
        await act(next);
        expect(destructor).toHaveBeenCalledTimes(destructorCallCount);
      }

      expect(commonMockDepMappingFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj(undefined, false, true), itResultObj(undefined, true)],
        [itResultObj(undefined, false, true), itResultObj('a')],
        [itResultObj(undefined, false, true), itResultObj('b')],
        [itResultObj(undefined, false, true), itResultObj('b', false, true, simulatedError)],
      ]);
      expect(effectFn.mock.calls).toStrictEqual([
        [itResultObj(undefined, true), itResultObj(undefined, true)],
        [itResultObj(undefined, false, true), itResultObj('a')],
      ]);
    });
  });
});

function itResultObj(
  value: unknown = undefined,
  pendingFirst: boolean = false,
  done: boolean = false,
  error: unknown = undefined
) {
  return { value, pendingFirst, done, error };
}

function createCommonMockDepMappingFn() {
  return vi.fn((...depsYields: IterationResult<string | AsyncIterable<string>>[]) =>
    depsYields.map(next => (next.value ?? '').length)
  );
}

const simulatedError = new Error('🚨 Simulated Error 🚨');
