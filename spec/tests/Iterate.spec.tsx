import { it, describe, expect, afterEach, vi } from 'vitest';
import { render, cleanup as cleanupMountedReactTrees, act } from '@testing-library/react';
import { Iterate, type IterationResult } from '../../src/index.js';
import { IterableChannelTestHelper } from '../utils/IterableChannelTestHelper.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`Iterate` component', () => {
  it('When used in the no-render-function form and given an iterable that yields a value will render correctly', async () => {
    const channel = new IterableChannelTestHelper<string>();

    const rendered = render(<Iterate>{channel}</Iterate>);

    expect(rendered.container.innerHTML).toStrictEqual('');
    await act(() => channel.put('a'));
    expect(rendered.container.innerHTML).toStrictEqual('a');
  });

  it('When used in the no-render-function form and updated with non-iterable values consecutively will render correctly', async () => {
    const rendered = render(<></>);

    for (const value of ['a', 'b', 'c']) {
      rendered.rerender(<Iterate>{value}</Iterate>);
      expect(rendered.container.innerHTML).toStrictEqual(`${value}`);
    }
  });

  it('When used in the no-render-function form and given an iterable that yields a value in conjunction with some initial value will render correctly', async () => {
    const channel = new IterableChannelTestHelper<string>();

    const rendered = render(<Iterate initialValue="_">{channel}</Iterate>);

    expect(rendered.container.innerHTML).toStrictEqual('_');
    await act(() => channel.put('a'));
    expect(rendered.container.innerHTML).toStrictEqual('a');
  });

  it('When used in the no-render-function form and updated with non-iterable values consecutively in conjunction with some initial value will render correctly', async () => {
    const rendered = render(<></>);

    for (const value of ['a', 'b', 'c']) {
      rendered.rerender(<Iterate initialValue="_">{value}</Iterate>);
      expect(rendered.container.innerHTML).toStrictEqual(`${value}`);
    }
  });

  it('When updated with non-iterable values consecutively will render correctly', async () => {
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string>;

    const rendered = render(<></>);

    for (const [i, value] of ['a', 'b', 'c'].entries()) {
      rendered.rerender(
        <Iterate value={value}>
          {next => {
            timesRerendered++;
            lastRenderFnInput = next;
            return <div id="test-created-elem">Render count: {timesRerendered}</div>;
          }}
        </Iterate>
      );

      expect(lastRenderFnInput).toStrictEqual({
        value,
        pendingFirst: false,
        done: false,
        error: undefined,
      });
      expect(timesRerendered).toStrictEqual(i + 1);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: ${timesRerendered}</div>`
      );
    }
  });

  it('When given a non-iterable value in conjunction with some initial value will render correctly', async () => {
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string>;

    const rendered = render(
      <Iterate initialValue="_" value="a">
        {next => {
          timesRerendered++;
          lastRenderFnInput = next;
          return <div id="test-created-elem">Render count: {timesRerendered}</div>;
        }}
      </Iterate>
    );

    expect(lastRenderFnInput).toStrictEqual({
      value: 'a',
      pendingFirst: false,
      done: false,
      error: undefined,
    });
    expect(timesRerendered).toStrictEqual(1);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 1</div>'
    );
  });

  it('When given an iterable that yields a value will render correctly', async () => {
    const channel = new IterableChannelTestHelper<string>();
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string>;

    const rendered = render(
      <Iterate value={channel}>
        {next => {
          timesRerendered++;
          lastRenderFnInput = next;
          return <div id="test-created-elem">Render count: {timesRerendered}</div>;
        }}
      </Iterate>
    );

    expect(lastRenderFnInput).toStrictEqual({
      value: undefined,
      pendingFirst: true,
      done: false,
      error: undefined,
    });
    expect(timesRerendered).toStrictEqual(1);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 1</div>'
    );

    await act(() => channel.put('a'));

    expect(lastRenderFnInput).toStrictEqual({
      value: 'a',
      pendingFirst: false,
      done: false,
      error: undefined,
    });
    expect(timesRerendered).toStrictEqual(2);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 2</div>'
    );
  });

  it('When given an iterable that yields a value in conjunction with some initial value will render correctly', async () => {
    const channel = new IterableChannelTestHelper<string>();
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string>;

    const rendered = render(
      <Iterate initialValue="_" value={channel}>
        {next => {
          timesRerendered++;
          lastRenderFnInput = next;
          return <div id="test-created-elem">Render count: {timesRerendered}</div>;
        }}
      </Iterate>
    );

    expect(lastRenderFnInput).toStrictEqual({
      value: '_',
      pendingFirst: true,
      done: false,
      error: undefined,
    });
    expect(timesRerendered).toStrictEqual(1);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 1</div>'
    );

    await act(() => channel.put('a'));

    expect(lastRenderFnInput).toStrictEqual({
      value: 'a',
      pendingFirst: false,
      done: false,
      error: undefined,
    });
    expect(timesRerendered).toStrictEqual(2);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 2</div>'
    );
  });

  it('When given an iterable that yields multiple values will render correctly', async () => {
    const channel = new IterableChannelTestHelper<string>();
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string>;

    const rendered = render(
      <Iterate value={channel}>
        {next => {
          timesRerendered++;
          lastRenderFnInput = next;
          return <div id="test-created-elem">Render count: {timesRerendered}</div>;
        }}
      </Iterate>
    );

    expect(lastRenderFnInput).toStrictEqual({
      value: undefined,
      pendingFirst: true,
      done: false,
      error: undefined,
    });
    expect(timesRerendered).toStrictEqual(1);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 1</div>'
    );

    for (const [i, value] of ['a', 'b', 'c'].entries()) {
      await act(() => channel.put(value));

      expect(lastRenderFnInput).toStrictEqual({
        value,
        pendingFirst: false,
        done: false,
        error: undefined,
      });
      expect(timesRerendered).toStrictEqual(2 + i);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: ${2 + i}</div>`
      );
    }
  });

  it('When given an iterable that completes without yielding values will render correctly', async () => {
    const emptyIter = (async function* () {})();
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string>;

    const rendered = render(
      <Iterate value={emptyIter}>
        {next => {
          timesRerendered++;
          lastRenderFnInput = next;
          return <div id="test-created-elem">Render count: {timesRerendered}</div>;
        }}
      </Iterate>
    );

    await act(() => {}); // To take us past the initial render and right after the first iteration

    expect(lastRenderFnInput).toStrictEqual({
      value: undefined,
      pendingFirst: false,
      done: true,
      error: undefined,
    });
    expect(timesRerendered).toStrictEqual(2);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 2</div>'
    );
  });

  it('When given an iterable that completes without yielding values in conjunction with some initial value will render correctly', async () => {
    const emptyIter = (async function* () {})();
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string>;

    const rendered = render(
      <Iterate initialValue="_" value={emptyIter}>
        {next => {
          timesRerendered++;
          lastRenderFnInput = next;
          return <div id="test-created-elem">Render count: {timesRerendered}</div>;
        }}
      </Iterate>
    );

    await act(() => {}); // To take us past the initial render and right after the first iteration

    expect(lastRenderFnInput).toStrictEqual({
      value: '_',
      pendingFirst: false,
      done: true,
      error: undefined,
    });
    expect(timesRerendered).toStrictEqual(2);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 2</div>'
    );
  });

  it('When given an iterable that yields a value and then completes will render correctly', async () => {
    const channel = new IterableChannelTestHelper<string>();
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string>;

    const rendered = render(
      <Iterate value={channel}>
        {next => {
          timesRerendered++;
          lastRenderFnInput = next;
          return <div id="test-created-elem">Render count: {timesRerendered}</div>;
        }}
      </Iterate>
    );

    await act(() => channel.put('a')); // To take us past the initial render and right after the first iteration

    expect(lastRenderFnInput).toStrictEqual({
      value: 'a',
      pendingFirst: false,
      done: false,
      error: undefined,
    });
    expect(timesRerendered).toStrictEqual(2);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 2</div>'
    );

    await act(() => channel.complete());

    expect(lastRenderFnInput).toStrictEqual({
      value: 'a',
      pendingFirst: false,
      done: true,
      error: undefined,
    });
    expect(timesRerendered).toStrictEqual(3);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 3</div>'
    );
  });

  it('When given an iterable that errors without yielding values will render correctly', async () => {
    const erroringIter = (async function* () {
      throw simulatedError;
    })();
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string>;

    const rendered = render(
      <Iterate value={erroringIter}>
        {next => {
          timesRerendered++;
          lastRenderFnInput = next;
          return <div id="test-created-elem">Render count: {timesRerendered}</div>;
        }}
      </Iterate>
    );

    await act(() => {}); // To take us past the initial render and right after the first iteration

    expect(lastRenderFnInput).toStrictEqual({
      value: undefined,
      pendingFirst: false,
      done: true,
      error: simulatedError,
    });
    expect(timesRerendered).toStrictEqual(2);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 2</div>'
    );
  });

  it('When given an iterable that errors without yielding values in conjunction with some initial value will render correctly', async () => {
    const erroringIter = (async function* () {
      throw simulatedError;
    })();
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string>;

    const rendered = render(
      <Iterate initialValue="_" value={erroringIter}>
        {next => {
          timesRerendered++;
          lastRenderFnInput = next;
          return <div id="test-created-elem">Render count: {timesRerendered}</div>;
        }}
      </Iterate>
    );

    await act(() => {}); // To take us past the initial render and right after the first iteration

    expect(lastRenderFnInput).toStrictEqual({
      value: '_',
      pendingFirst: false,
      done: true,
      error: simulatedError,
    });
    expect(timesRerendered).toStrictEqual(2);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 2</div>'
    );
  });

  it('When given an iterable that yields a value and then errors will render correctly', async () => {
    const channel = new IterableChannelTestHelper<string>();
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string>;

    const simulatedErr = new Error('...');

    const rendered = render(
      <Iterate value={channel}>
        {next => {
          timesRerendered++;
          lastRenderFnInput = next;
          return <div id="test-created-elem">Render count: {timesRerendered}</div>;
        }}
      </Iterate>
    );

    await act(() => channel.put('a'));

    expect(lastRenderFnInput).toStrictEqual({
      value: 'a',
      pendingFirst: false,
      done: false,
      error: undefined,
    });
    expect(timesRerendered).toStrictEqual(2);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 2</div>'
    );

    await act(() => channel.error(simulatedErr));

    expect(lastRenderFnInput).toStrictEqual({
      value: 'a',
      pendingFirst: false,
      done: true,
      error: simulatedErr,
    });
    expect(timesRerendered).toStrictEqual(3);
    expect(rendered.container.innerHTML).toStrictEqual(
      '<div id="test-created-elem">Render count: 3</div>'
    );
  });

  it("When consequtively updated with new iterables will close the previous one's iterator every time and render accordingly", async () => {
    let lastRenderFnInput: undefined | IterationResult<string>;

    const [channel1, channel2] = [
      new IterableChannelTestHelper<string>(),
      new IterableChannelTestHelper<string>(),
    ];

    const [channel1IterCloseSpy, channel2IterCloseSpy] = [
      vi.spyOn(channel1, 'return'),
      vi.spyOn(channel2, 'return'),
    ];

    const buildTestContent = (value: AsyncIterable<string>) => {
      return (
        <Iterate value={value}>
          {next => {
            lastRenderFnInput = next;
            return <div id="test-created-elem">{next.value}</div>;
          }}
        </Iterate>
      );
    };

    const rendered = render(<></>);

    {
      rendered.rerender(buildTestContent(channel1));

      expect(channel1IterCloseSpy).not.toHaveBeenCalled();
      expect(channel2IterCloseSpy).not.toHaveBeenCalled();
      expect(lastRenderFnInput).toStrictEqual({
        value: undefined,
        pendingFirst: true,
        done: false,
        error: undefined,
      });
      expect(rendered.container.innerHTML).toStrictEqual('<div id="test-created-elem"></div>');

      await act(() => channel1.put('a'));

      expect(lastRenderFnInput).toStrictEqual({
        value: 'a',
        pendingFirst: false,
        done: false,
        error: undefined,
      });
      expect(rendered.container.innerHTML).toStrictEqual('<div id="test-created-elem">a</div>');
    }

    {
      rendered.rerender(buildTestContent(channel2));

      expect(channel1IterCloseSpy).toHaveBeenCalledOnce();
      expect(channel2IterCloseSpy).not.toHaveBeenCalled();
      expect(lastRenderFnInput).toStrictEqual({
        value: 'a',
        pendingFirst: true,
        done: false,
        error: undefined,
      });
      expect(rendered.container.innerHTML).toStrictEqual('<div id="test-created-elem">a</div>');

      await act(() => channel2.put('b'));

      expect(lastRenderFnInput).toStrictEqual({
        value: 'b',
        pendingFirst: false,
        done: false,
        error: undefined,
      });
      expect(rendered.container.innerHTML).toStrictEqual('<div id="test-created-elem">b</div>');
    }

    {
      rendered.rerender(buildTestContent((async function* () {})()));

      expect(channel1IterCloseSpy).toHaveBeenCalledOnce();
      expect(channel2IterCloseSpy).toHaveBeenCalledOnce();
      expect(lastRenderFnInput).toStrictEqual({
        value: 'b',
        pendingFirst: true,
        done: false,
        error: undefined,
      });
      expect(rendered.container.innerHTML).toStrictEqual('<div id="test-created-elem">b</div>');
    }
  });

  it('When unmounted will close the last active iterator it held', async () => {
    let lastRenderFnInput: undefined | IterationResult<string>;

    const channel = new IterableChannelTestHelper<string>();
    const channelIterCloseSpy = vi.spyOn(channel, 'return');

    const buildTestContent = (value: AsyncIterable<string>) => {
      return (
        <Iterate value={value}>
          {next => {
            lastRenderFnInput = next;
            return <div id="test-created-elem">{next.value}</div>;
          }}
        </Iterate>
      );
    };

    const rendered = render(<></>);

    {
      rendered.rerender(buildTestContent(channel));

      expect(channelIterCloseSpy).not.toHaveBeenCalled();
      expect(lastRenderFnInput).toStrictEqual({
        value: undefined,
        pendingFirst: true,
        done: false,
        error: undefined,
      });
      expect(rendered.container.innerHTML).toStrictEqual('<div id="test-created-elem"></div>');

      await act(() => channel.put('a'));

      expect(lastRenderFnInput).toStrictEqual({
        value: 'a',
        pendingFirst: false,
        done: false,
        error: undefined,
      });
      expect(rendered.container.innerHTML).toStrictEqual('<div id="test-created-elem">a</div>');
    }

    {
      rendered.unmount();
      expect(channelIterCloseSpy).toHaveBeenCalledOnce();
    }
  });
});

const simulatedError = new Error('🚨 Simulated Error 🚨');
