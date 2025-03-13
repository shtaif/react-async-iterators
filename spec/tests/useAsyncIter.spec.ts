import { it, describe, expect, afterEach, vi } from 'vitest';
import { gray } from 'colorette';
import { cleanup as cleanupMountedReactTrees, act, renderHook } from '@testing-library/react';
import { useAsyncIter, iterateFormatted } from '../libEntrypoint.js';
import { asyncIterOf } from '../utils/asyncIterOf.js';
import { IteratorChannelTestHelper } from '../utils/IteratorChannelTestHelper.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`useAsyncIter` hook', () => {
  it(
    gray('When updated with non-iterable values consecutively will render correctly'),
    async () => {
      let timesRerendered = 0;

      const renderedHook = renderHook(
        ({ value }) => {
          timesRerendered++;
          return useAsyncIter(value);
        },
        { initialProps: { value: '' } }
      );

      for (const [i, value] of ['a', 'b', 'c'].entries()) {
        renderedHook.rerender({ value });
        expect(timesRerendered).toStrictEqual(2 + i);
        expect(renderedHook.result.current).toStrictEqual({
          value,
          pendingFirst: false,
          done: false,
          error: undefined,
        });
      }
    }
  );

  it(gray('When given a non-iterable value will return correct results'), async () => {
    let timesRerendered = 0;

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIter('a');
    });

    expect(timesRerendered).toStrictEqual(1);
    expect(renderedHook.result.current).toStrictEqual({
      value: 'a',
      pendingFirst: false,
      done: false,
      error: undefined,
    });
  });

  it(
    gray(
      'When given a non-iterable value starting in some initial value will return correct results'
    ),
    async () => {
      let timesRerendered = 0;

      const renderedHook = renderHook(() => {
        timesRerendered++;
        return useAsyncIter('a', '_');
      });

      expect(timesRerendered).toStrictEqual(1);
      expect(renderedHook.result.current).toStrictEqual({
        value: 'a',
        pendingFirst: false,
        done: false,
        error: undefined,
      });
    }
  );

  it(gray('When given an iterable that yields a value will return correct results'), async () => {
    const channel = new IteratorChannelTestHelper<string>();

    const renderedHook = renderHook(() => useAsyncIter(channel));

    expect(renderedHook.result.current).toStrictEqual({
      value: undefined,
      pendingFirst: true,
      done: false,
      error: undefined,
    });

    await act(() => channel.put('a'));

    expect(renderedHook.result.current).toStrictEqual({
      value: 'a',
      pendingFirst: false,
      done: false,
      error: undefined,
    });
  });

  it(
    gray(
      'When given an iterable that yields a value starting in some initial value will return correct results'
    ),
    async () => {
      const channel = new IteratorChannelTestHelper<string>();

      const renderedHook = renderHook(() => useAsyncIter(channel, '_'));

      expect(renderedHook.result.current).toStrictEqual({
        value: '_',
        pendingFirst: true,
        done: false,
        error: undefined,
      });

      await act(() => channel.put('a'));

      expect(renderedHook.result.current).toStrictEqual({
        value: 'a',
        pendingFirst: false,
        done: false,
        error: undefined,
      });
    }
  );

  it(
    gray('When given an iterable that yields multiple values will return correct results'),
    async () => {
      let timesRerendered = 0;
      const channel = new IteratorChannelTestHelper<string>();

      const renderedHook = renderHook(() => {
        timesRerendered++;
        return useAsyncIter(channel);
      });

      expect(timesRerendered).toStrictEqual(1);
      expect(renderedHook.result.current).toStrictEqual({
        value: undefined,
        pendingFirst: true,
        done: false,
        error: undefined,
      });

      for (const [i, value] of ['a', 'b', 'c'].entries()) {
        await act(() => channel.put(value));
        expect(timesRerendered).toStrictEqual(i + 2);
        expect(renderedHook.result.current).toStrictEqual({
          value,
          pendingFirst: false,
          done: false,
          error: undefined,
        });
      }
    }
  );

  it(
    gray(
      'When given an iterable that completes without yielding values will return correct results'
    ),
    async () => {
      let timesRerendered = 0;
      const emptyIter = (async function* () {})();

      const renderedHook = renderHook(() => {
        timesRerendered++;
        return useAsyncIter(emptyIter);
      });

      await act(() => {}); // To take us past the initial render and right after the first iteration

      expect(timesRerendered).toStrictEqual(2);
      expect(renderedHook.result.current).toStrictEqual({
        value: undefined,
        pendingFirst: false,
        done: true,
        error: undefined,
      });
    }
  );

  it(
    gray(
      'When given an iterable that completes without yielding values starting in some initial value will return correct results'
    ),
    async () => {
      let timesRerendered = 0;
      const emptyIter = (async function* () {})();

      const renderedHook = renderHook(() => {
        timesRerendered++;
        return useAsyncIter(emptyIter, '_');
      });

      await act(() => {}); // To take us past the initial render and right after the first iteration

      expect(timesRerendered).toStrictEqual(2);
      expect(renderedHook.result.current).toStrictEqual({
        value: '_',
        pendingFirst: false,
        done: true,
        error: undefined,
      });
    }
  );

  it(
    gray(
      'When given an iterable that yields a value and then completes will return correct results'
    ),
    async () => {
      let timesRerendered = 0;
      const channel = new IteratorChannelTestHelper<string>();

      const renderedHook = renderHook(() => {
        timesRerendered++;
        return useAsyncIter(channel);
      });

      await act(() => channel.put('a')); // To take us past the initial render and right after the first iteration

      expect(timesRerendered).toStrictEqual(2);
      expect(renderedHook.result.current).toStrictEqual({
        value: 'a',
        pendingFirst: false,
        done: false,
        error: undefined,
      });

      await act(() => channel.complete());

      expect(timesRerendered).toStrictEqual(3);
      expect(renderedHook.result.current).toStrictEqual({
        value: 'a',
        pendingFirst: false,
        done: true,
        error: undefined,
      });
    }
  );

  it(
    gray('When given an iterable that errors without yielding values will return correct results'),
    async () => {
      let timesRerendered = 0;

      const erroringIter = (async function* () {
        throw simulatedError;
      })();

      const renderedHook = renderHook(() => {
        timesRerendered++;
        return useAsyncIter(erroringIter);
      });

      await act(() => {}); // To take us past the initial render and right after the first iteration

      expect(timesRerendered).toStrictEqual(2);
      expect(renderedHook.result.current).toStrictEqual({
        value: undefined,
        pendingFirst: false,
        done: true,
        error: simulatedError,
      });
    }
  );

  it(
    gray(
      'When given an iterable that errors without yielding values starting in some initial value will return correct results'
    ),
    async () => {
      let timesRerendered = 0;

      const erroringIter = (async function* () {
        throw simulatedError;
      })();

      const renderedHook = renderHook(() => {
        timesRerendered++;
        return useAsyncIter(erroringIter, '_');
      });

      await act(() => {}); // To take us past the initial render and right after the first iteration

      expect(timesRerendered).toStrictEqual(2);
      expect(renderedHook.result.current).toStrictEqual({
        value: '_',
        pendingFirst: false,
        done: true,
        error: simulatedError,
      });
    }
  );

  it(
    gray('When given an iterable that yields a value and then errors will return correct results'),
    async () => {
      let timesRerendered = 0;
      const channel = new IteratorChannelTestHelper<string>();
      const simulatedErr = new Error('...');

      const renderedHook = renderHook(() => {
        timesRerendered++;
        return useAsyncIter(channel);
      });

      await act(() => channel.put('a'));

      expect(timesRerendered).toStrictEqual(2);
      expect(renderedHook.result.current).toStrictEqual({
        value: 'a',
        pendingFirst: false,
        done: false,
        error: undefined,
      });

      await act(() => channel.error(simulatedErr));

      expect(timesRerendered).toStrictEqual(3);
      expect(renderedHook.result.current).toStrictEqual({
        value: 'a',
        pendingFirst: false,
        done: true,
        error: simulatedErr,
      });
    }
  );

  it(
    gray(
      "When consecutively updated with new iterables will close the previous one's iterator every time and render accordingly"
    ),
    async () => {
      const [channel1, channel2] = [
        new IteratorChannelTestHelper<string>(),
        new IteratorChannelTestHelper<string>(),
      ];

      const renderedHook = renderHook(({ value }) => useAsyncIter(value), {
        initialProps: {
          value: (async function* () {})() as AsyncIterable<string>,
        },
      });

      {
        renderedHook.rerender({ value: channel1 });

        expect(channel1.return).not.toHaveBeenCalled();
        expect(channel2.return).not.toHaveBeenCalled();
        expect(renderedHook.result.current).toStrictEqual({
          value: undefined,
          pendingFirst: true,
          done: false,
          error: undefined,
        });

        await act(() => channel1.put('a'));

        expect(renderedHook.result.current).toStrictEqual({
          value: 'a',
          pendingFirst: false,
          done: false,
          error: undefined,
        });
      }

      {
        renderedHook.rerender({ value: channel2 });

        expect(channel1.return).toHaveBeenCalledOnce();
        expect(channel2.return).not.toHaveBeenCalled();
        expect(renderedHook.result.current).toStrictEqual({
          value: 'a',
          pendingFirst: true,
          done: false,
          error: undefined,
        });

        await act(() => channel2.put('b'));

        expect(renderedHook.result.current).toStrictEqual({
          value: 'b',
          pendingFirst: false,
          done: false,
          error: undefined,
        });
      }

      {
        renderedHook.rerender({ value: (async function* () {})() });

        expect(channel1.return).toHaveBeenCalledOnce();
        expect(channel2.return).toHaveBeenCalledOnce();
        expect(renderedHook.result.current).toStrictEqual({
          value: 'b',
          pendingFirst: true,
          done: false,
          error: undefined,
        });
      }
    }
  );

  it(
    gray(
      'When given an initial value as a function, calls it once on mount and uses its result as the initial value correctly'
    ),
    async () => {
      const channel = new IteratorChannelTestHelper<string>();
      const initValFn = vi.fn(() => '_');

      const renderedHook = await act(() => renderHook(() => useAsyncIter(channel, initValFn)));
      const results = [renderedHook.result.current];

      await act(() => renderedHook.rerender());
      results.push(renderedHook.result.current);

      await act(() => channel.put('a'));
      results.push(renderedHook.result.current);

      expect(initValFn).toHaveBeenCalledOnce();
      expect(results).toStrictEqual([
        { value: '_', pendingFirst: true, done: false, error: undefined },
        { value: '_', pendingFirst: true, done: false, error: undefined },
        { value: 'a', pendingFirst: false, done: false, error: undefined },
      ]);
    }
  );

  describe(
    gray(
      'When given an iterable with a `.value.current` property at any point, uses that as the current value and skips the pending stage'
    ),
    () => {
      ([{ initialValue: undefined }, { initialValue: '_' }] as const).forEach(
        ({ initialValue }) => {
          it(
            gray(
              `${!initialValue ? 'without initial value' : 'with initial value and ignoring it'}`
            ),
            async () => {
              const [channel1, channel2] = ['a_current', 'b_current'].map(current =>
                Object.assign(new IteratorChannelTestHelper<string>(), {
                  value: { current },
                })
              );

              const renderedHook = renderHook(props => useAsyncIter(props.value, initialValue), {
                initialProps: { value: undefined as undefined | AsyncIterable<string> },
              });

              const results: any[] = [];

              for (const next of [
                () => renderedHook.rerender({ value: channel1 }),
                () => channel1.put('a'),
                () =>
                  renderedHook.rerender({
                    value: iterateFormatted(channel2, (val, i) => `${val}_formatted_${i}`),
                  }),
                () => channel2.put('b'),
              ]) {
                await act(next);
                results.push(renderedHook.result.current);
              }

              expect(results).toStrictEqual(
                ['a_current', 'a', 'b_current_formatted_0', 'b_formatted_1'].map(value => ({
                  value,
                  pendingFirst: false,
                  done: false,
                  error: undefined,
                }))
              );
            }
          );
        }
      );

      it(gray('with a formatted iterable'), async () => {
        let timesRerendered = 0;
        const channel = Object.assign(new IteratorChannelTestHelper<string>(), {
          value: { current: 'a_current' },
        });

        const renderedHook = await act(() =>
          renderHook(() => {
            timesRerendered++;
            return useAsyncIter(iterateFormatted(channel, (val, i) => `${val}_formatted_${i}`));
          })
        );
        expect(timesRerendered).toStrictEqual(1);
        expect(renderedHook.result.current).toStrictEqual({
          value: 'a_current_formatted_0',
          pendingFirst: false,
          done: false,
          error: undefined,
        });

        await act(() => channel.put('a_next'));
        expect(timesRerendered).toStrictEqual(2);
        expect(renderedHook.result.current).toStrictEqual({
          value: 'a_next_formatted_1',
          pendingFirst: false,
          done: false,
          error: undefined,
        });
      });
    }
  );

  it(gray('When unmounted will close the last active iterator it held'), async () => {
    const channel = new IteratorChannelTestHelper<string>();

    const renderedHook = renderHook(({ value }) => useAsyncIter(value), {
      initialProps: {
        value: (async function* () {})() as AsyncIterable<string>,
      },
    });

    {
      renderedHook.rerender({ value: channel });

      expect(channel.return).not.toHaveBeenCalled();
      expect(renderedHook.result.current).toStrictEqual({
        value: undefined,
        pendingFirst: true,
        done: false,
        error: undefined,
      });

      await act(() => channel.put('a'));

      expect(renderedHook.result.current).toStrictEqual({
        value: 'a',
        pendingFirst: false,
        done: false,
        error: undefined,
      });
    }

    {
      renderedHook.unmount();
      expect(channel.return).toHaveBeenCalledOnce();
    }
  });

  it(
    gray(
      'When given a rapid-yielding iterable, consecutive values are batched into a single render that takes only the last value'
    ),
    async () => {
      let timesRerendered = 0;
      const iter = asyncIterOf('a', 'b', 'c');

      const renderedHook = renderHook(() => {
        timesRerendered++;
        return useAsyncIter(iter);
      });

      await act(() => {});

      expect(timesRerendered).toStrictEqual(2);
      expect(renderedHook.result.current).toStrictEqual({
        value: 'c',
        pendingFirst: false,
        done: true,
        error: undefined,
      });
    }
  );

  it(
    gray(
      'When given iterable yields consecutive identical values after the first, the hook will not re-render'
    ),
    async () => {
      let timesRerendered = 0;
      const channel = new IteratorChannelTestHelper<string>();

      const renderedHook = renderHook(() => {
        timesRerendered++;
        return useAsyncIter(channel);
      });

      for (let i = 0; i < 3; ++i) {
        await act(() => channel.put('a'));
      }

      expect(timesRerendered).toStrictEqual(2);
      expect(renderedHook.result.current).toStrictEqual({
        value: 'a',
        pendingFirst: false,
        done: false,
        error: undefined,
      });
    }
  );

  it(
    gray(
      "When given iterable's first yield is identical to the previous value, the hook does re-render"
    ),
    async () => {
      let timesRerendered = 0;
      const channel1 = new IteratorChannelTestHelper<string>();

      const renderedHook = await act(() =>
        renderHook(
          ({ channel }) => {
            timesRerendered++;
            return useAsyncIter(channel);
          },
          { initialProps: { channel: channel1 } }
        )
      );

      await act(() => channel1.put('a'));

      const channel2 = new IteratorChannelTestHelper<string>();
      await act(() => renderedHook.rerender({ channel: channel2 }));
      expect(timesRerendered).toStrictEqual(3);
      expect(renderedHook.result.current).toStrictEqual({
        value: 'a',
        pendingFirst: true,
        done: false,
        error: undefined,
      });

      await act(() => channel2.put('a'));
      expect(timesRerendered).toStrictEqual(4);
      expect(renderedHook.result.current).toStrictEqual({
        value: 'a',
        pendingFirst: false,
        done: false,
        error: undefined,
      });
    }
  );

  it(
    gray(
      'When given a formatted iterable yielding `undefined`s or `null`s that wraps a source iter yielding non-null values, returns the `undefined`s and `null`s in the result as expected (https://github.com/shtaif/react-async-iterators/pull/32)'
    ),
    async () => {
      const channel = new IteratorChannelTestHelper<string>();
      let timesRerendered = 0;

      const renderedHook = await act(() =>
        renderHook(
          ({ formatTo }) => {
            timesRerendered++;
            return useAsyncIter(iterateFormatted(channel, _ => formatTo));
          },
          {
            initialProps: { formatTo: '' as string | null | undefined },
          }
        )
      );

      await act(() => {
        channel.put('a');
        renderedHook.rerender({ formatTo: null });
      });
      expect(timesRerendered).toStrictEqual(3);
      expect(renderedHook.result.current).toStrictEqual({
        value: null,
        pendingFirst: false,
        done: false,
        error: undefined,
      });

      await act(() => {
        channel.put('b');
        renderedHook.rerender({ formatTo: undefined });
      });
      expect(timesRerendered).toStrictEqual(5);
      expect(renderedHook.result.current).toStrictEqual({
        value: undefined,
        pendingFirst: false,
        done: false,
        error: undefined,
      });
    }
  );
});

const simulatedError = new Error('🚨 Simulated Error 🚨');
