import { it, describe, expect, afterEach } from 'vitest';
import { gray } from 'colorette';
import { cleanup as cleanupMountedReactTrees, act, renderHook } from '@testing-library/react';
import { iterateFormatted, useAsyncIterMulti } from '../../src/index.js';
import { pipe } from '../utils/pipe.js';
import { asyncIterOf } from '../utils/asyncIterOf.js';
import { IteratorChannelTestHelper } from '../utils/IteratorChannelTestHelper.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`useAsyncIterMulti` hook', () => {
  it(gray('When given an empty array, returns an empty array'), async () => {
    let timesRerendered = 0;

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterMulti([]);
    });

    await act(() => {});

    expect(timesRerendered).toStrictEqual(1);
    expect(renderedHook.result.current).toStrictEqual([]);
  });

  it(gray('When given multiple `undefined`s and `null`s, returns them as-are'), async () => {
    let timesRerendered = 0;

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterMulti([undefined, null, undefined, null]);
    });

    await act(() => {});

    expect(timesRerendered).toStrictEqual(1);
    expect(renderedHook.result.current).toStrictEqual(
      [undefined, null, undefined, null].map(value => ({
        value,
        pendingFirst: false,
        done: false,
        error: undefined,
      }))
    );
  });

  it(gray('When given multiple non-iterables, returns them as-are'), async () => {
    let timesRerendered = 0;

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterMulti(['a', 'b', 'c']);
    });

    await act(() => {});

    expect(timesRerendered).toStrictEqual(1);
    expect(renderedHook.result.current).toStrictEqual(
      ['a', 'b', 'c'].map(value => ({
        value,
        pendingFirst: false,
        done: false,
        error: undefined,
      }))
    );
  });

  it(gray('When given and updated with multiple non-iterables, returns them as-are'), async () => {
    let timesRerendered = 0;

    const renderedHook = renderHook(
      props => {
        timesRerendered++;
        return useAsyncIterMulti(props.values);
      },
      { initialProps: { values: ['a1', 'b1', 'c1'] } }
    );

    await act(() => {});

    expect(timesRerendered).toStrictEqual(1);
    expect(renderedHook.result.current).toStrictEqual(
      ['a1', 'b1', 'c1'].map(value => ({
        value,
        pendingFirst: false,
        done: false,
        error: undefined,
      }))
    );

    await act(() => renderedHook.rerender({ values: ['a1', 'b2', 'c2'] }));

    expect(timesRerendered).toStrictEqual(2);
    expect(renderedHook.result.current).toStrictEqual(
      ['a1', 'b2', 'c2'].map(value => ({
        value,
        pendingFirst: false,
        done: false,
        error: undefined,
      }))
    );
  });

  it(
    gray(
      'When given multiple non-iterables together with initial values, returns them as-are, ignoring initial values'
    ),
    async () => {
      let timesRerendered = 0;

      const renderedHook = renderHook(() => {
        timesRerendered++;
        return useAsyncIterMulti(['a', 'b', 'c'], { initialValues: ['_', '_', '_'] });
      });

      await act(() => {});

      expect(timesRerendered).toStrictEqual(1);
      expect(renderedHook.result.current).toStrictEqual(
        ['a', 'b', 'c'].map(value => ({
          value,
          pendingFirst: false,
          done: false,
          error: undefined,
        }))
      );
    }
  );

  it(gray("When given multiple iterables, reflects each's states correctly"), async () => {
    const channels = [
      new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
      new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
    ] as const;
    let timesRerendered = 0;

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterMulti(channels);
    });

    await act(() => {});
    expect(timesRerendered).toStrictEqual(1);
    expect(renderedHook.result.current).toStrictEqual([
      { value: undefined, pendingFirst: true, done: false, error: undefined },
      { value: undefined, pendingFirst: true, done: false, error: undefined },
    ]);

    await act(() => channels[0].put('a'));
    expect(timesRerendered).toStrictEqual(2);
    expect(renderedHook.result.current).toStrictEqual([
      { value: 'a', pendingFirst: false, done: false, error: undefined },
      { value: undefined, pendingFirst: true, done: false, error: undefined },
    ]);

    await act(() => channels[1].put('b'));
    expect(timesRerendered).toStrictEqual(3);
    expect(renderedHook.result.current).toStrictEqual([
      { value: 'a', pendingFirst: false, done: false, error: undefined },
      { value: 'b', pendingFirst: false, done: false, error: undefined },
    ]);
  });

  it(
    gray("When given multiple iterables, some empty, reflects each's states correctly"),
    async () => {
      let timesRerendered = 0;

      const iter = asyncIterOf('a');
      const emptyIter = asyncIterOf();

      const renderedHook = await act(() =>
        renderHook(() => {
          timesRerendered++;
          return useAsyncIterMulti([iter, emptyIter]);
        })
      );

      expect(timesRerendered).toStrictEqual(2);
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a', pendingFirst: false, done: true, error: undefined },
        { value: undefined, pendingFirst: false, done: true, error: undefined },
      ]);
    }
  );

  describe(
    gray(
      "When given multiple iterables with corresponding initial values, reflects each's states correctly, starting with its corresponding initial value where present"
    ),
    () => {
      it(gray('with initial values for all given iterables'), async () => {
        const channels = [
          new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
          new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
        ] as const;
        let timesRerendered = 0;

        const renderedHook = renderHook(() => {
          timesRerendered++;
          return useAsyncIterMulti(channels, { initialValues: ['_1_', '_2_'] });
        });

        await act(() => {});
        expect(timesRerendered).toStrictEqual(1);
        expect(renderedHook.result.current).toStrictEqual([
          { value: '_1_', pendingFirst: true, done: false, error: undefined },
          { value: '_2_', pendingFirst: true, done: false, error: undefined },
        ]);

        await act(() => channels[0].put('a'));
        expect(timesRerendered).toStrictEqual(2);
        expect(renderedHook.result.current).toStrictEqual([
          { value: 'a', pendingFirst: false, done: false, error: undefined },
          { value: '_2_', pendingFirst: true, done: false, error: undefined },
        ]);

        await act(() => channels[1].put('b'));
        expect(timesRerendered).toStrictEqual(3);
        expect(renderedHook.result.current).toStrictEqual([
          { value: 'a', pendingFirst: false, done: false, error: undefined },
          { value: 'b', pendingFirst: false, done: false, error: undefined },
        ]);
      });

      it(gray('with initial values only for some given iterables'), async () => {
        const channels = [
          new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
          new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
        ] as const;
        let timesRerendered = 0;

        const renderedHook = renderHook(() => {
          timesRerendered++;
          return useAsyncIterMulti(channels, { initialValues: ['_1_'] });
        });

        await act(() => {});
        expect(timesRerendered).toStrictEqual(1);
        expect(renderedHook.result.current).toStrictEqual([
          { value: '_1_', pendingFirst: true, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ]);

        await act(() => channels[0].put('a'));
        expect(timesRerendered).toStrictEqual(2);
        expect(renderedHook.result.current).toStrictEqual([
          { value: 'a', pendingFirst: false, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ]);

        await act(() => channels[1].put('b'));
        expect(timesRerendered).toStrictEqual(3);
        expect(renderedHook.result.current).toStrictEqual([
          { value: 'a', pendingFirst: false, done: false, error: undefined },
          { value: 'b', pendingFirst: false, done: false, error: undefined },
        ]);
      });
    }
  );

  describe(
    gray(
      `When given multiple iterables that complete at different times, reflects each's states correctly`
    ),
    () => {
      [
        {
          initialValues: undefined,
        },
        {
          initialValues: ['_1', '_2'],
        },
      ].forEach(({ initialValues = [] }) => {
        it(
          gray(`${!initialValues.length ? 'without initial values' : 'with initial values'}`),
          async () => {
            const channels = [
              new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
              new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
            ] as const;
            let timesRerendered = 0;

            const renderedHook = renderHook(() => {
              timesRerendered++;
              return useAsyncIterMulti(channels, { initialValues });
            });

            await act(() => {});
            expect(timesRerendered).toStrictEqual(1);
            expect(renderedHook.result.current).toStrictEqual([
              { value: initialValues[0], pendingFirst: true, done: false, error: undefined },
              { value: initialValues[1], pendingFirst: true, done: false, error: undefined },
            ]);

            await act(() => channels[0].put('a'));
            expect(timesRerendered).toStrictEqual(2);
            expect(renderedHook.result.current).toStrictEqual([
              { value: 'a', pendingFirst: false, done: false, error: undefined },
              { value: initialValues[1], pendingFirst: true, done: false, error: undefined },
            ]);

            await act(() => channels[1].complete());
            expect(timesRerendered).toStrictEqual(3);
            expect(renderedHook.result.current).toStrictEqual([
              { value: 'a', pendingFirst: false, done: false, error: undefined },
              { value: initialValues[1], pendingFirst: false, done: true, error: undefined },
            ]);

            await act(() => channels[0].complete());
            expect(timesRerendered).toStrictEqual(4);
            expect(renderedHook.result.current).toStrictEqual([
              { value: 'a', pendingFirst: false, done: true, error: undefined },
              { value: initialValues[1], pendingFirst: false, done: true, error: undefined },
            ]);
          }
        );
      });
    }
  );

  describe(
    gray(
      `When given multiple iterables that error out at different times, reflects each's states correctly`
    ),
    () => {
      [
        {
          initialValues: undefined,
        },
        {
          initialValues: ['_1', '_2'],
        },
      ].forEach(({ initialValues = [] }) => {
        it(
          gray(`${!initialValues.length ? 'without initial values' : 'with initial values'}`),
          async () => {
            const channels = [
              new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
              new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
            ] as const;
            let timesRerendered = 0;

            const renderedHook = renderHook(() => {
              timesRerendered++;
              return useAsyncIterMulti(channels, { initialValues });
            });

            await act(() => {});
            expect(timesRerendered).toStrictEqual(1);
            expect(renderedHook.result.current).toStrictEqual([
              { value: initialValues[0], pendingFirst: true, done: false, error: undefined },
              { value: initialValues[1], pendingFirst: true, done: false, error: undefined },
            ]);

            await act(() => channels[0].put('a'));
            expect(timesRerendered).toStrictEqual(2);
            expect(renderedHook.result.current).toStrictEqual([
              { value: 'a', pendingFirst: false, done: false, error: undefined },
              { value: initialValues[1], pendingFirst: true, done: false, error: undefined },
            ]);

            await act(() => channels[1].error(simulatedError1));
            expect(timesRerendered).toStrictEqual(3);
            expect(renderedHook.result.current).toStrictEqual([
              { value: 'a', pendingFirst: false, done: false, error: undefined },
              { value: initialValues[1], pendingFirst: false, done: true, error: simulatedError1 },
            ]);

            await act(() => channels[0].error(simulatedError2));
            expect(timesRerendered).toStrictEqual(4);
            expect(renderedHook.result.current).toStrictEqual([
              { value: 'a', pendingFirst: false, done: true, error: simulatedError2 },
              { value: initialValues[1], pendingFirst: false, done: true, error: simulatedError1 },
            ]);
          }
        );
      });
    }
  );

  it(
    gray(
      "When consecutively updated with new iterables will close the previous ones' iterator every time and reflect states accordingly"
    ),
    async () => {
      let channel1 = new IteratorChannelTestHelper<'a' | 'b' | 'c'>();
      let channel2 = new IteratorChannelTestHelper<'a' | 'b' | 'c'>();
      const origChannel1ReturnSpy = channel1.return;
      const origChannel2ReturnSpy = channel2.return;
      let timesRerendered = 0;

      const renderedHook = renderHook(
        props => {
          timesRerendered++;
          return useAsyncIterMulti(props.values);
        },
        { initialProps: { values: [channel1, channel2] as const } }
      );

      await act(() => {});
      expect(timesRerendered).toStrictEqual(1);
      expect(origChannel1ReturnSpy).not.toHaveBeenCalled();
      expect(origChannel2ReturnSpy).not.toHaveBeenCalled();
      expect(renderedHook.result.current).toStrictEqual([
        { value: undefined, pendingFirst: true, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => channel1.put('a'));
      expect(timesRerendered).toStrictEqual(2);
      expect(origChannel1ReturnSpy).not.toHaveBeenCalled();
      expect(origChannel2ReturnSpy).not.toHaveBeenCalled();
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a', pendingFirst: false, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => {
        channel1 = new IteratorChannelTestHelper();
        renderedHook.rerender({ values: [channel1, channel2] as const });
      });
      expect(timesRerendered).toStrictEqual(3);
      expect(origChannel1ReturnSpy).toHaveBeenCalledOnce();
      expect(origChannel2ReturnSpy).not.toHaveBeenCalled();
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a', pendingFirst: true, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => {
        channel2 = new IteratorChannelTestHelper();
        renderedHook.rerender({ values: [channel1, channel2] as const });
      });
      expect(timesRerendered).toStrictEqual(4);
      expect(origChannel1ReturnSpy).toHaveBeenCalledOnce();
      expect(origChannel2ReturnSpy).toHaveBeenCalledOnce();
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a', pendingFirst: true, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => channel1.put('b'));
      expect(timesRerendered).toStrictEqual(5);
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'b', pendingFirst: false, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);
    }
  );

  describe(
    gray(
      'When given multiple iterables with `.value.current` properties at any point, uses these as current values respectively and skips the pending stages'
    ),
    () =>
      [{ initialValues: undefined }, { initialValues: ['_1', '_2'] }].forEach(
        ({ initialValues }) => {
          it(
            gray(
              `${!initialValues?.length ? 'without initial values' : 'with initial values and ignoring them'}`
            ),
            async () => {
              const [channel1, channel2] = ['a_current', 'b_current'].map(current =>
                Object.assign(new IteratorChannelTestHelper<string>(), {
                  value: { current },
                })
              );

              const renderedHook = renderHook(
                props => useAsyncIterMulti(props.values, { initialValues }),
                { initialProps: { values: [] as AsyncIterable<string>[] } }
              );

              const results: any[] = [];

              for (const run of [
                () => act(() => renderedHook.rerender({ values: [channel1] })),
                () => act(() => channel1.put('a')),
                () =>
                  act(() =>
                    renderedHook.rerender({
                      values: [
                        iterateFormatted(channel2, (val, i) => `${val}_formatted_${i}`),
                        channel1,
                      ],
                    })
                  ),
                () => act(() => channel2.put('b')),
              ]) {
                await run();
                results.push(renderedHook.result.current);
              }

              expect(results).toStrictEqual([
                [{ value: 'a_current', pendingFirst: false, done: false, error: undefined }],
                [{ value: 'a', pendingFirst: false, done: false, error: undefined }],
                [
                  {
                    value: 'b_current_formatted_0',
                    pendingFirst: false,
                    done: false,
                    error: undefined,
                  },
                  { value: 'a', pendingFirst: false, done: false, error: undefined },
                ],
                [
                  { value: 'b_formatted_0', pendingFirst: false, done: false, error: undefined },
                  { value: 'a', pendingFirst: false, done: false, error: undefined },
                ],
              ]);
            }
          );
        }
      )
  );

  it(gray('When unmounted will close all active iterators it has been holding'), async () => {
    const channel1 = new IteratorChannelTestHelper<'a' | 'b' | 'c'>();
    const channel2 = new IteratorChannelTestHelper<'a' | 'b' | 'c'>();

    const renderedHook = renderHook(props => useAsyncIterMulti(props.values), {
      initialProps: {
        values: [
          undefined as undefined | IteratorChannelTestHelper<'a' | 'b' | 'c'>,
          undefined as undefined | IteratorChannelTestHelper<'a' | 'b' | 'c'>,
        ] as const,
      },
    });

    {
      await act(() => renderedHook.rerender({ values: [channel1, channel2] }));
      expect(channel1.return).not.toHaveBeenCalled();
      expect(channel2.return).not.toHaveBeenCalled();
      expect(renderedHook.result.current).toStrictEqual([
        { value: undefined, pendingFirst: true, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => channel1.put('a'));
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a', pendingFirst: false, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);
    }

    {
      renderedHook.unmount();
      expect(channel1.return).toHaveBeenCalledOnce();
      expect(channel2.return).toHaveBeenCalledOnce();
    }
  });

  it(
    gray(
      'When adding / removing / swapping positions of iterables, their ongoing states are maintained at every step regardless of position and get closed only when they disappear altogether from passed array'
    ),
    async () => {
      const values: (string | IteratorChannelTestHelper<string>)[] = [];

      const channelA = new IteratorChannelTestHelper<string>();
      const channelB = new IteratorChannelTestHelper<string>();
      const channelC = new IteratorChannelTestHelper<string>();

      const renderedHook = await act(() =>
        renderHook(({ values }) => useAsyncIterMulti(values), {
          initialProps: { values },
        })
      );
      expect(renderedHook.result.current).toStrictEqual([]);

      await act(() => {
        values.push(channelA);
        renderedHook.rerender({ values });
      });
      expect(renderedHook.result.current).toStrictEqual([
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => {
        values.push(channelB);
        renderedHook.rerender({ values });
      });
      expect(renderedHook.result.current).toStrictEqual([
        { value: undefined, pendingFirst: true, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => {
        values.push(channelC);
        renderedHook.rerender({ values });
      });
      expect(renderedHook.result.current).toStrictEqual([
        { value: undefined, pendingFirst: true, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => channelA.put('a_from_iter'));
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => channelB.put('b_from_iter'));
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: 'b_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => channelC.put('c_from_iter'));
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: 'b_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: 'c_from_iter', pendingFirst: false, done: false, error: undefined },
      ]);

      await act(() => {
        values.push('d_static', 'e_static', 'f_static');
        renderedHook.rerender({ values });
      });
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: 'b_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: 'c_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: 'd_static', pendingFirst: false, done: false, error: undefined },
        { value: 'e_static', pendingFirst: false, done: false, error: undefined },
        { value: 'f_static', pendingFirst: false, done: false, error: undefined },
      ]);

      await act(() => {
        values.reverse();
        renderedHook.rerender({ values });
      });
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'f_static', pendingFirst: false, done: false, error: undefined },
        { value: 'e_static', pendingFirst: false, done: false, error: undefined },
        { value: 'd_static', pendingFirst: false, done: false, error: undefined },
        { value: 'c_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: 'b_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
      ]);

      await act(() => {
        values.splice(0, 3);
        renderedHook.rerender({ values });
      });
      expect(channelC.return).not.toHaveBeenCalled();
      expect(channelB.return).not.toHaveBeenCalled();
      expect(channelA.return).not.toHaveBeenCalled();
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'c_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: 'b_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
      ]);

      await act(() => {
        values.shift();
        renderedHook.rerender({ values });
      });
      expect(channelC.return).toHaveBeenCalledOnce();
      expect(channelB.return).not.toHaveBeenCalled();
      expect(channelA.return).not.toHaveBeenCalled();
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'b_from_iter', pendingFirst: false, done: false, error: undefined },
        { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
      ]);

      await act(() => {
        values.shift();
        renderedHook.rerender({ values });
      });
      expect(channelC.return).toHaveBeenCalledOnce();
      expect(channelB.return).toHaveBeenCalledOnce();
      expect(channelA.return).not.toHaveBeenCalled();
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
      ]);

      await act(() => {
        values.shift();
        renderedHook.rerender({ values });
      });
      expect(channelC.return).toHaveBeenCalledOnce();
      expect(channelB.return).toHaveBeenCalledOnce();
      expect(channelA.return).toHaveBeenCalledOnce();
      expect(renderedHook.result.current).toStrictEqual([]);
    }
  );

  it(
    gray(
      'If any given iterable yields consecutive identical values after the first, the hook will not re-render'
    ),
    async () => {
      const channel1 = new IteratorChannelTestHelper<string>();
      const channel2 = new IteratorChannelTestHelper<string>();
      let timesRerendered = 0;

      const renderedHook = await act(() =>
        renderHook(() => {
          timesRerendered++;
          return useAsyncIterMulti([channel1, channel2]);
        })
      );

      for (let i = 0; i < 3; ++i) {
        await act(() => (channel1.put('a'), channel2.put('b')));
        await act(() => channel1.put('a'));
        await act(() => channel2.put('b'));
      }

      expect(timesRerendered).toStrictEqual(2);
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a', pendingFirst: false, done: false, error: undefined },
        { value: 'b', pendingFirst: false, done: false, error: undefined },
      ]);
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
            return useAsyncIterMulti([channel]);
          },
          { initialProps: { channel: channel1 } }
        )
      );

      await act(() => channel1.put('a'));

      const channel2 = new IteratorChannelTestHelper<string>();
      await act(() => renderedHook.rerender({ channel: channel2 }));
      expect(timesRerendered).toStrictEqual(3);
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a', pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => channel2.put('a'));
      expect(timesRerendered).toStrictEqual(4);
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a', pendingFirst: false, done: false, error: undefined },
      ]);
    }
  );

  it(
    gray(
      'When given rapid-yielding iterables, consecutive values are batched into a single render that takes only the most recent values'
    ),
    async () => {
      const values = [
        'a',
        asyncIterOf('b'),
        asyncIterOf('_1', 'c'),
        asyncIterOf('_1', '_2', 'd'),
        asyncIterOf('_1', '_2', '_3', 'e'),
      ];
      let timesRerendered = 0;

      const renderedHook = await act(() =>
        renderHook(() => {
          timesRerendered++;
          return useAsyncIterMulti(values);
        })
      );

      expect(timesRerendered).toStrictEqual(2);
      expect(renderedHook.result.current).toStrictEqual([
        { value: 'a', pendingFirst: false, done: false, error: undefined },
        { value: 'b', pendingFirst: false, done: true, error: undefined },
        { value: 'c', pendingFirst: false, done: true, error: undefined },
        { value: 'd', pendingFirst: false, done: true, error: undefined },
        { value: 'e', pendingFirst: false, done: true, error: undefined },
      ]);
    }
  );

  it(
    gray(
      'When given `ReactAsyncIterables`, maintains the iteration states based on the original source iters they contain and applies the next given format functions correctly'
    ),
    async () => {
      const channel1 = new IteratorChannelTestHelper<string>();
      const channel2 = new IteratorChannelTestHelper<string>();

      const renderedHook = await act(() =>
        renderHook(() =>
          useAsyncIterMulti(
            [channel1, channel2].map(ch =>
              pipe(
                ch,
                $ => iterateFormatted($, (val, i) => `${val} >> formatted once (idx: ${i})`),
                $ => iterateFormatted($, (val, i) => `${val} >> and formatted twice (idx: ${i})`)
              )
            )
          )
        )
      );

      for (let i = 0; i < 3; ++i) {
        await act(() => renderedHook.rerender());
      }
      expect(channel1.return).not.toHaveBeenCalled();
      expect(channel2.return).not.toHaveBeenCalled();

      await act(() => channel1.put('a'));
      expect(renderedHook.result.current).toStrictEqual([
        {
          value: 'a >> formatted once (idx: 0) >> and formatted twice (idx: 0)',
          pendingFirst: false,
          done: false,
          error: undefined,
        },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => channel2.put('b'));
      expect(renderedHook.result.current).toStrictEqual([
        {
          value: 'a >> formatted once (idx: 0) >> and formatted twice (idx: 0)',
          pendingFirst: false,
          done: false,
          error: undefined,
        },
        {
          value: 'b >> formatted once (idx: 0) >> and formatted twice (idx: 0)',
          pendingFirst: false,
          done: false,
          error: undefined,
        },
      ]);

      await act(() => (channel1.put('a'), channel2.put('b')));
      expect(renderedHook.result.current).toStrictEqual([
        {
          value: 'a >> formatted once (idx: 1) >> and formatted twice (idx: 1)',
          pendingFirst: false,
          done: false,
          error: undefined,
        },
        {
          value: 'b >> formatted once (idx: 1) >> and formatted twice (idx: 1)',
          pendingFirst: false,
          done: false,
          error: undefined,
        },
      ]);
    }
  );

  it(
    gray(
      'When given `ReactAsyncIterable`s yielding `undefined`s or `null`s that wrap iters which originally yield non-nullable values, returns the `undefined`s and `null`s in the results as expected'
    ),
    async () => {
      const channel1 = new IteratorChannelTestHelper<string>();
      const channel2 = new IteratorChannelTestHelper<string>();
      let timesRerendered = 0;

      const renderedHook = await act(() =>
        renderHook(
          ({ formatInto }) => {
            timesRerendered++;
            return useAsyncIterMulti([
              iterateFormatted(channel1, _ => formatInto),
              iterateFormatted(channel2, _ => formatInto),
            ]);
          },
          {
            initialProps: { formatInto: '' as string | null | undefined },
          }
        )
      );

      await act(() => {
        channel1.put('a');
        channel2.put('a');
        renderedHook.rerender({ formatInto: null });
      });
      expect(timesRerendered).toStrictEqual(3);
      expect(renderedHook.result.current).toStrictEqual([
        { value: null, pendingFirst: false, done: false, error: undefined },
        { value: null, pendingFirst: false, done: false, error: undefined },
      ]);

      await act(() => {
        channel1.put('b');
        channel2.put('b');
        renderedHook.rerender({ formatInto: undefined });
      });
      expect(timesRerendered).toStrictEqual(5);
      expect(renderedHook.result.current).toStrictEqual([
        { value: undefined, pendingFirst: false, done: false, error: undefined },
        { value: undefined, pendingFirst: false, done: false, error: undefined },
      ]);
    }
  );
});

const simulatedError1 = new Error('🚨 Simulated Error 1 🚨');
const simulatedError2 = new Error('🚨 Simulated Error 2 🚨');
