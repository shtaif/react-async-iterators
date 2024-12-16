import { it, describe, expect, afterEach, vi } from 'vitest';
import { cleanup as cleanupMountedReactTrees, act, renderHook } from '@testing-library/react';
import { useAsyncIterable } from '../../src/index.js';
import { IterableChannelTestHelper } from '../utils/IterableChannelTestHelper.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`useAsyncIterable` hook', () => {
  it('When updated with non-iterable values consecutively will render correctly', async () => {
    let timesRerendered = 0;

    const renderedHook = renderHook(
      ({ value }) => {
        timesRerendered++;
        return useAsyncIterable(value);
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
  });

  it('When given a non-iterable value will return correct results', async () => {
    let timesRerendered = 0;

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterable('a');
    });

    expect(timesRerendered).toStrictEqual(1);
    expect(renderedHook.result.current).toStrictEqual({
      value: 'a',
      pendingFirst: false,
      done: false,
      error: undefined,
    });
  });

  it('When given a non-iterable value in conjunction with some initial value will return correct results', async () => {
    let timesRerendered = 0;

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterable('a', '_');
    });

    expect(timesRerendered).toStrictEqual(1);
    expect(renderedHook.result.current).toStrictEqual({
      value: 'a',
      pendingFirst: false,
      done: false,
      error: undefined,
    });
  });

  it('When given an iterable that yields a value will return correct results', async () => {
    const channel = new IterableChannelTestHelper<string>();

    const renderedHook = renderHook(() => useAsyncIterable(channel));

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

  it('When given an iterable that yields a value in conjunction with some initial value will return correct results', async () => {
    const channel = new IterableChannelTestHelper<string>();

    const renderedHook = renderHook(() => useAsyncIterable(channel, '_'));

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
  });

  it('When given an iterable that yields multiple values will return correct results', async () => {
    let timesRerendered = 0;
    const channel = new IterableChannelTestHelper<string>();

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterable(channel);
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
  });

  it('When given an iterable that completes without yielding values will return correct results', async () => {
    let timesRerendered = 0;
    const emptyIter = (async function* () {})();

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterable(emptyIter);
    });

    await act(() => {}); // To take us past the initial render and right after the first iteration

    expect(timesRerendered).toStrictEqual(2);
    expect(renderedHook.result.current).toStrictEqual({
      value: undefined,
      pendingFirst: false,
      done: true,
      error: undefined,
    });
  });

  it('When given an iterable that completes without yielding values in conjunction with some initial value will return correct results', async () => {
    let timesRerendered = 0;
    const emptyIter = (async function* () {})();

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterable(emptyIter, '_');
    });

    await act(() => {}); // To take us past the initial render and right after the first iteration

    expect(timesRerendered).toStrictEqual(2);
    expect(renderedHook.result.current).toStrictEqual({
      value: '_',
      pendingFirst: false,
      done: true,
      error: undefined,
    });
  });

  it('When given an iterable that yields a value and then completes will return correct results', async () => {
    let timesRerendered = 0;
    const channel = new IterableChannelTestHelper<string>();

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterable(channel);
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
  });

  it('When given an iterable that errors without yielding values will return correct results', async () => {
    let timesRerendered = 0;

    const erroringIter = (async function* () {
      throw simulatedError;
    })();

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterable(erroringIter);
    });

    await act(() => {}); // To take us past the initial render and right after the first iteration

    expect(timesRerendered).toStrictEqual(2);
    expect(renderedHook.result.current).toStrictEqual({
      value: undefined,
      pendingFirst: false,
      done: true,
      error: simulatedError,
    });
  });

  it('When given an iterable that errors without yielding values in conjunction with some initial value will return correct results', async () => {
    let timesRerendered = 0;

    const erroringIter = (async function* () {
      throw simulatedError;
    })();

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterable(erroringIter, '_');
    });

    await act(() => {}); // To take us past the initial render and right after the first iteration

    expect(timesRerendered).toStrictEqual(2);
    expect(renderedHook.result.current).toStrictEqual({
      value: '_',
      pendingFirst: false,
      done: true,
      error: simulatedError,
    });
  });

  it('When given an iterable that yields a value and then errors will return correct results', async () => {
    let timesRerendered = 0;
    const channel = new IterableChannelTestHelper<string>();
    const simulatedErr = new Error('...');

    const renderedHook = renderHook(() => {
      timesRerendered++;
      return useAsyncIterable(channel);
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
  });

  it("When consequtively updated with new iterables will close the previous one's iterator every time and render accordingly", async () => {
    const [channel1, channel2] = [
      new IterableChannelTestHelper<string>(),
      new IterableChannelTestHelper<string>(),
    ];

    const [channel1IterCloseSpy, channel2IterCloseSpy] = [
      vi.spyOn(channel1, 'return'),
      vi.spyOn(channel2, 'return'),
    ];

    const renderedHook = renderHook(({ value }) => useAsyncIterable(value), {
      initialProps: {
        value: (async function* () {})() as AsyncIterable<string>,
      },
    });

    {
      renderedHook.rerender({ value: channel1 });

      expect(channel1IterCloseSpy).not.toHaveBeenCalled();
      expect(channel2IterCloseSpy).not.toHaveBeenCalled();
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

      expect(channel1IterCloseSpy).toHaveBeenCalledOnce();
      expect(channel2IterCloseSpy).not.toHaveBeenCalled();
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

      expect(channel1IterCloseSpy).toHaveBeenCalledOnce();
      expect(channel2IterCloseSpy).toHaveBeenCalledOnce();
      expect(renderedHook.result.current).toStrictEqual({
        value: 'b',
        pendingFirst: true,
        done: false,
        error: undefined,
      });
    }
  });

  it('When unmounted will close the last active iterator it held', async () => {
    const channel = new IterableChannelTestHelper<string>();
    const channelIterCloseSpy = vi.spyOn(channel, 'return');

    const renderedHook = renderHook(({ value }) => useAsyncIterable(value), {
      initialProps: {
        value: (async function* () {})() as AsyncIterable<string>,
      },
    });

    {
      renderedHook.rerender({ value: channel });

      expect(channelIterCloseSpy).not.toHaveBeenCalled();
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
      expect(channelIterCloseSpy).toHaveBeenCalledOnce();
    }
  });
});

const simulatedError = new Error('🚨 Simulated Error 🚨');