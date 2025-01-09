import { it, describe, expect, afterEach, vi, type Mock } from 'vitest';
import { gray } from 'colorette';
import { render, cleanup as cleanupMountedReactTrees, act } from '@testing-library/react';
import { Iterate, It, iterateFormatted, type IterationResult } from '../../src/index.js';
import { asyncIterOf } from '../utils/asyncIterOf.js';
import { IteratorChannelTestHelper } from '../utils/IteratorChannelTestHelper.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`Iterate` component', () => {
  it(gray('Importable also as `<It>`'), () => {
    expect(Iterate).toStrictEqual(It);
  });

  it(
    gray(
      'When used in the no-render-function form and given an iterable that yields a value will render correctly'
    ),
    async () => {
      const channel = new IteratorChannelTestHelper<string>();

      const rendered = render(<Iterate>{channel}</Iterate>);

      expect(rendered.container.innerHTML).toStrictEqual('');
      await act(() => channel.put('a'));
      expect(rendered.container.innerHTML).toStrictEqual('a');
    }
  );

  it(
    gray(
      'When used in the no-render-function form and updated with non-iterable values consecutively will render correctly'
    ),
    async () => {
      const rendered = render(<></>);

      for (const value of ['a', 'b', 'c']) {
        rendered.rerender(<Iterate>{value}</Iterate>);
        expect(rendered.container.innerHTML).toStrictEqual(`${value}`);
      }
    }
  );

  it(
    gray(
      'When used in the no-render-function form and given an iterable that yields a value in conjunction with some initial value will render correctly'
    ),
    async () => {
      const channel = new IteratorChannelTestHelper<string>();

      const rendered = render(<Iterate initialValue="_">{channel}</Iterate>);

      expect(rendered.container.innerHTML).toStrictEqual('_');
      await act(() => channel.put('a'));
      expect(rendered.container.innerHTML).toStrictEqual('a');
    }
  );

  it(
    gray(
      'When used in the no-render-function form and updated with non-iterable values consecutively in conjunction with some initial value will render correctly'
    ),
    async () => {
      const rendered = render(<></>);

      for (const value of ['a', 'b', 'c']) {
        rendered.rerender(<Iterate initialValue="_">{value}</Iterate>);
        expect(rendered.container.innerHTML).toStrictEqual(`${value}`);
      }
    }
  );

  it(
    gray('When updated with non-iterable values consecutively will render correctly'),
    async () => {
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
    }
  );

  it(
    gray(
      'When given a non-iterable value in conjunction with some initial value will render correctly'
    ),
    async () => {
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
    }
  );

  it(gray('When given an iterable that yields a value will render correctly'), async () => {
    const channel = new IteratorChannelTestHelper<string>();
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string | undefined>;

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

  it(
    gray(
      'When given an iterable that yields a value in conjunction with some initial value will render correctly'
    ),
    async () => {
      const channel = new IteratorChannelTestHelper<string>();
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
    }
  );

  it(gray('When given an iterable that yields multiple values will render correctly'), async () => {
    const channel = new IteratorChannelTestHelper<string>();
    let timesRerendered = 0;
    let lastRenderFnInput: undefined | IterationResult<string | undefined>;

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

  it(
    gray('When given an iterable that completes without yielding values will render correctly'),
    async () => {
      const emptyIter = (async function* () {})();
      let timesRerendered = 0;
      let lastRenderFnInput: undefined | IterationResult<string | undefined>;

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
    }
  );

  it(
    gray(
      'When given an iterable that completes without yielding values in conjunction with some initial value will render correctly'
    ),
    async () => {
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
    }
  );

  it(
    gray('When given an iterable that yields a value and then completes will render correctly'),
    async () => {
      const channel = new IteratorChannelTestHelper<string>();
      let timesRerendered = 0;
      let lastRenderFnInput: undefined | IterationResult<string | undefined>;

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
    }
  );

  it(
    gray('When given an iterable that errors without yielding values will render correctly'),
    async () => {
      const erroringIter = (async function* () {
        throw simulatedError;
      })();
      let timesRerendered = 0;
      let lastRenderFnInput: undefined | IterationResult<string | undefined>;

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
    }
  );

  it(
    gray(
      'When given an iterable that errors without yielding values in conjunction with some initial value will render correctly'
    ),
    async () => {
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
    }
  );

  it(
    gray('When given an iterable that yields a value and then errors will render correctly'),
    async () => {
      const channel = new IteratorChannelTestHelper<string>();
      let timesRerendered = 0;
      let lastRenderFnInput: undefined | IterationResult<string | undefined>;

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
    }
  );

  it(
    gray(
      "When consecutively updated with new iterables will close the previous one's iterator every time and render accordingly"
    ),
    async () => {
      let lastRenderFnInput: undefined | IterationResult<string | undefined>;

      const [channel1, channel2] = [
        new IteratorChannelTestHelper<string>(),
        new IteratorChannelTestHelper<string>(),
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

        expect(channel1.return).not.toHaveBeenCalled();
        expect(channel2.return).not.toHaveBeenCalled();
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

        expect(channel1.return).toHaveBeenCalledOnce();
        expect(channel2.return).not.toHaveBeenCalled();
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

        expect(channel1.return).toHaveBeenCalledOnce();
        expect(channel2.return).toHaveBeenCalledOnce();
        expect(lastRenderFnInput).toStrictEqual({
          value: 'b',
          pendingFirst: true,
          done: false,
          error: undefined,
        });
        expect(rendered.container.innerHTML).toStrictEqual('<div id="test-created-elem">b</div>');
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
      const renderFn = vi.fn() as Mock<
        (next: IterationResult<AsyncIterable<string>, string>) => any
      >;

      const Component = (props: { value: AsyncIterable<string> }) => (
        <Iterate value={props.value} initialValue={initValFn}>
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </Iterate>
      );

      const rendered = render(<></>);

      await act(() => rendered.rerender(<Component value={channel} />));
      const renderedHtmls = [rendered.container.innerHTML];

      await act(() => rendered.rerender(<Component value={channel} />));
      renderedHtmls.push(rendered.container.innerHTML);

      await act(() => channel.put('a'));
      renderedHtmls.push(rendered.container.innerHTML);

      expect(initValFn).toHaveBeenCalledOnce();
      expect(renderFn.mock.calls).toStrictEqual([
        [{ value: '_', pendingFirst: true, done: false, error: undefined }],
        [{ value: '_', pendingFirst: true, done: false, error: undefined }],
        [{ value: 'a', pendingFirst: false, done: false, error: undefined }],
      ]);
      expect(renderedHtmls).toStrictEqual([
        '<div id="test-created-elem">Render count: 1</div>',
        '<div id="test-created-elem">Render count: 2</div>',
        '<div id="test-created-elem">Render count: 3</div>',
      ]);
    }
  );

  it(gray('When unmounted will close the last active iterator it held'), async () => {
    let lastRenderFnInput: undefined | IterationResult<string | undefined>;

    const channel = new IteratorChannelTestHelper<string>();

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

      expect(channel.return).not.toHaveBeenCalled();
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
      expect(channel.return).toHaveBeenCalledOnce();
    }
  });

  it(
    gray(
      'When given a rapid-yielding iterable, consecutive values are batched into a single render that takes only the last value'
    ),
    async () => {
      const iter = asyncIterOf('a', 'b', 'c');
      let timesRerendered = 0;
      let lastRenderFnInput: undefined | IterationResult<string | undefined>;

      const rendered = render(
        <Iterate value={iter}>
          {next => {
            timesRerendered++;
            lastRenderFnInput = next;
            return <div id="test-created-elem">Render count: {timesRerendered}</div>;
          }}
        </Iterate>
      );

      await act(() => {});

      expect(lastRenderFnInput).toStrictEqual({
        value: 'c',
        pendingFirst: false,
        done: true,
        error: undefined,
      });
      expect(timesRerendered).toStrictEqual(2);
      expect(rendered.container.innerHTML).toStrictEqual(
        '<div id="test-created-elem">Render count: 2</div>'
      );
    }
  );

  it(
    gray(
      'When given iterable yields consecutive identical values after the first, the component will not re-render'
    ),
    async () => {
      const channel = new IteratorChannelTestHelper<string>();
      const renderFn = vi.fn() as Mock<
        (next: IterationResult<AsyncIterable<string | undefined>>) => any
      >;

      const rendered = render(
        <Iterate value={channel}>
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </Iterate>
      );

      for (let i = 0; i < 3; ++i) {
        await act(() => channel.put('a'));
      }

      expect(renderFn.mock.calls).lengthOf(2);
      expect(renderFn.mock.lastCall).toStrictEqual([
        { value: 'a', pendingFirst: false, done: false, error: undefined },
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        '<div id="test-created-elem">Render count: 2</div>'
      );
    }
  );

  it(
    gray(
      "When given iterable's first yield is identical to the previous value, the component does re-render"
    ),
    async () => {
      const renderFn = vi.fn() as Mock<
        (next: IterationResult<AsyncIterable<string | undefined>>) => any
      >;
      const channel1 = new IteratorChannelTestHelper<string>();

      const Component = (props: { value: AsyncIterable<string> }) => {
        return (
          <Iterate value={props.value}>
            {renderFn.mockImplementation(() => (
              <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
            ))}
          </Iterate>
        );
      };

      const rendered = await act(() => render(<Component value={channel1} />));

      await act(() => channel1.put('a'));

      const channel2 = new IteratorChannelTestHelper<string>();
      await act(() => rendered.rerender(<Component value={channel2} />));
      expect(renderFn.mock.calls).lengthOf(3);
      expect(renderFn.mock.lastCall).toStrictEqual([
        {
          value: 'a',
          pendingFirst: true,
          done: false,
          error: undefined,
        },
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        '<div id="test-created-elem">Render count: 3</div>'
      );

      await act(() => channel2.put('a'));
      expect(renderFn.mock.calls).lengthOf(4);
      expect(renderFn.mock.lastCall).toStrictEqual([
        {
          value: 'a',
          pendingFirst: false,
          done: false,
          error: undefined,
        },
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        '<div id="test-created-elem">Render count: 4</div>'
      );
    }
  );

  it(
    gray(
      'When given a `ReactAsyncIterable` yielding `undefined`s or `null`s that wraps an iter which originally yields non-nullable values, processes the `undefined`s and `null` values expected'
    ),
    async () => {
      const channel = new IteratorChannelTestHelper<string>();
      const renderFn = vi.fn() as Mock<
        (next: IterationResult<AsyncIterable<string | null | undefined>>) => any
      >;

      const buildContent = (iter: AsyncIterable<string>, formatInto: string | null | undefined) => {
        return (
          <Iterate value={iterateFormatted(iter, _ => formatInto)}>
            {renderFn.mockImplementation(next => (
              <div id="test-created-elem">{next.value + ''}</div>
            ))}
          </Iterate>
        );
      };

      const rendered = render(<></>);

      rendered.rerender(buildContent(channel, ''));

      await act(() => {
        channel.put('a');
        rendered.rerender(buildContent(channel, null));
      });
      expect(renderFn.mock.lastCall).toStrictEqual([
        { value: null, pendingFirst: false, done: false, error: undefined },
      ]);
      expect(rendered.container.innerHTML).toStrictEqual('<div id="test-created-elem">null</div>');

      await act(() => {
        channel.put('b');
        rendered.rerender(buildContent(channel, undefined));
      });
      expect(renderFn.mock.lastCall).toStrictEqual([
        { value: undefined, pendingFirst: false, done: false, error: undefined },
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        '<div id="test-created-elem">undefined</div>'
      );
    }
  );
});

const simulatedError = new Error('🚨 Simulated Error 🚨');
