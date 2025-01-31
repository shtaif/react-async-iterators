import { it, describe, expect, afterEach, vi, type Mock } from 'vitest';
import { gray } from 'colorette';
import { cleanup as cleanupMountedReactTrees, act, render } from '@testing-library/react';
import {
  iterateFormatted,
  IterateMulti,
  ItMulti,
  type IterateMultiProps,
  type IterationResultSet,
} from '../../src/index.js';
import { pipe } from '../utils/pipe.js';
import { asyncIterOf } from '../utils/asyncIterOf.js';
import { IteratorChannelTestHelper } from '../utils/IteratorChannelTestHelper.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`IterateMulti` hook', () => {
  it(gray('Importable also as `<ItMulti>`'), () => {
    expect(IterateMulti).toStrictEqual(ItMulti);
  });

  it(gray('When given an empty array, renders with an empty array'), async () => {
    const renderFn = vi.fn() as Mock<IterateMultiRenderFunc<[]>>;

    const rendered = await act(() =>
      render(
        <IterateMulti values={[]}>
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </IterateMulti>
      )
    );

    expect(renderFn.mock.calls).lengthOf(1);
    expect(renderFn.mock.lastCall).toStrictEqual([[]]);
    expect(rendered.container.innerHTML).toStrictEqual(
      `<div id="test-created-elem">Render count: 1</div>`
    );
  });

  it(gray('When given multiple `undefined`s and `null`s, renders with them as-are'), async () => {
    const renderFn = vi.fn() as Mock<IterateMultiRenderFunc<[undefined, null, undefined, null]>>;

    const rendered = await act(() =>
      render(
        <IterateMulti values={[undefined, null, undefined, null]}>
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </IterateMulti>
      )
    );

    expect(renderFn.mock.calls).lengthOf(1);
    expect(renderFn.mock.lastCall).toStrictEqual([
      [
        { value: undefined, pendingFirst: false, done: false, error: undefined },
        { value: null, pendingFirst: false, done: false, error: undefined },
        { value: undefined, pendingFirst: false, done: false, error: undefined },
        { value: null, pendingFirst: false, done: false, error: undefined },
      ],
    ]);
    expect(rendered.container.innerHTML).toStrictEqual(
      `<div id="test-created-elem">Render count: 1</div>`
    );
  });

  it(gray('When given multiple non-iterables, renders with them as-are'), async () => {
    const renderFn = vi.fn() as Mock<IterateMultiRenderFunc<['a', 'b', 'c']>>;

    const rendered = await act(() =>
      render(
        <IterateMulti values={['a', 'b', 'c']}>
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </IterateMulti>
      )
    );

    expect(renderFn.mock.calls).lengthOf(1);
    expect(renderFn.mock.lastCall).toStrictEqual([
      [
        { value: 'a', pendingFirst: false, done: false, error: undefined },
        { value: 'b', pendingFirst: false, done: false, error: undefined },
        { value: 'c', pendingFirst: false, done: false, error: undefined },
      ],
    ]);
    expect(rendered.container.innerHTML).toStrictEqual(
      `<div id="test-created-elem">Render count: 1</div>`
    );
  });

  it(
    gray('When given and updated with multiple non-iterables, render with them as-are'),
    async () => {
      const renderFn = vi.fn() as Mock<IterateMultiProps<[string, string, string]>['children']>;

      const Component = (props: { values: [string, string, string] }) => (
        <IterateMulti values={props.values}>
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </IterateMulti>
      );

      const rendered = render(<></>);

      await act(() => rendered.rerender(<Component values={['a1', 'b1', 'c1']} />));

      expect(renderFn.mock.calls).lengthOf(1);
      expect(renderFn.mock.lastCall).toStrictEqual([
        ['a1', 'b1', 'c1'].map(value => ({
          value,
          pendingFirst: false,
          done: false,
          error: undefined,
        })),
      ]);

      await act(() => rendered.rerender(<Component values={['a1', 'b2', 'c2']} />));

      expect(renderFn.mock.calls).lengthOf(2);
      expect(renderFn.mock.lastCall).toStrictEqual([
        ['a1', 'b2', 'c2'].map(value => ({
          value,
          pendingFirst: false,
          done: false,
          error: undefined,
        })),
      ]);
    }
  );

  it(
    gray(
      'When given multiple non-iterables together with initial values, renders with them as-are, ignoring initial values'
    ),
    async () => {
      const renderFn = vi.fn() as Mock<IterateMultiProps<[string, string, string]>['children']>;

      const rendered = await act(() =>
        render(
          <IterateMulti values={['a', 'b', 'c']} initialValues={['_', '_', '_']}>
            {renderFn.mockImplementation(() => (
              <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
            ))}
          </IterateMulti>
        )
      );

      await act(() => {});

      expect(renderFn.mock.calls).lengthOf(1);
      expect(renderFn.mock.lastCall).toStrictEqual([
        ['a', 'b', 'c'].map(value => ({
          value,
          pendingFirst: false,
          done: false,
          error: undefined,
        })),
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 1</div>`
      );
    }
  );

  it(gray("When given multiple iterables, correctly renders each's state"), async () => {
    const renderFn = vi.fn() as Mock<
      IterateMultiRenderFunc<[AsyncIterable<'a' | 'b' | 'c'>, AsyncIterable<'a' | 'b' | 'c'>]>
    >;
    const channels = [
      new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
      new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
    ] as const;

    const rendered = await act(() =>
      render(
        <IterateMulti values={channels}>
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </IterateMulti>
      )
    );

    await act(() => {});
    expect(renderFn.mock.calls).lengthOf(1);
    expect(renderFn.mock.lastCall).toStrictEqual([
      [
        { value: undefined, pendingFirst: true, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ],
    ]);
    expect(rendered.container.innerHTML).toStrictEqual(
      `<div id="test-created-elem">Render count: 1</div>`
    );

    await act(() => channels[0].put('a'));
    expect(renderFn.mock.calls).lengthOf(2);
    expect(renderFn.mock.lastCall).toStrictEqual([
      [
        { value: 'a', pendingFirst: false, done: false, error: undefined },
        { value: undefined, pendingFirst: true, done: false, error: undefined },
      ],
    ]);
    expect(rendered.container.innerHTML).toStrictEqual(
      `<div id="test-created-elem">Render count: 2</div>`
    );

    await act(() => channels[1].put('b'));
    expect(renderFn.mock.calls).lengthOf(3);
    expect(renderFn.mock.lastCall).toStrictEqual([
      [
        { value: 'a', pendingFirst: false, done: false, error: undefined },
        { value: 'b', pendingFirst: false, done: false, error: undefined },
      ],
    ]);
    expect(rendered.container.innerHTML).toStrictEqual(
      `<div id="test-created-elem">Render count: 3</div>`
    );
  });

  it(
    gray("When given multiple iterables, some empty, renders each's state correctly"),
    async () => {
      const renderFn = vi.fn() as Mock<
        IterateMultiProps<[AsyncIterable<'a'>, AsyncIterable<never>]>['children']
      >;
      const iter = asyncIterOf('a');
      const emptyIter = asyncIterOf();

      const rendered = await act(() =>
        render(
          <IterateMulti values={[iter, emptyIter]}>
            {renderFn.mockImplementation(() => (
              <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
            ))}
          </IterateMulti>
        )
      );

      expect(renderFn.mock.calls).lengthOf(2);
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'a', pendingFirst: false, done: true, error: undefined },
          { value: undefined, pendingFirst: false, done: true, error: undefined },
        ],
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 2</div>`
      );
    }
  );

  it(
    gray(
      'When given multiple iterables with a default initial value as a function, calls it once whenever a new iterable is added'
    ),
    async () => {
      const channels = [
        new IteratorChannelTestHelper<string>(),
        new IteratorChannelTestHelper<string>(),
      ];
      const initialValueFn = vi.fn(() => '___');
      const renderFn = vi.fn() as Mock<
        (nexts: IterationResultSet<AsyncIterable<string>[], [], '___'>) => any
      >;

      const Component = ({ values }: { values: AsyncIterable<string>[] }) => (
        <IterateMulti values={values} defaultInitialValue={initialValueFn}>
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </IterateMulti>
      );

      const rendered = render(<></>);

      await act(() => rendered.rerender(<Component values={channels} />));
      expect(renderFn.mock.calls).lengthOf(1);
      expect(renderFn.mock.lastCall?.flat()).toStrictEqual([
        { value: '___', pendingFirst: true, done: false, error: undefined },
        { value: '___', pendingFirst: true, done: false, error: undefined },
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 1</div>`
      );

      await act(() => {
        channels[0].put('a');
        channels[1].put('b');
      });
      expect(renderFn.mock.calls).lengthOf(2);
      expect(renderFn.mock.lastCall?.flat()).toStrictEqual([
        { value: 'a', pendingFirst: false, done: false, error: undefined },
        { value: 'b', pendingFirst: false, done: false, error: undefined },
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 2</div>`
      );

      await act(() => {
        channels.push(new IteratorChannelTestHelper());
        rendered.rerender(<Component values={channels} />);
      });
      expect(renderFn.mock.calls).lengthOf(3);
      expect(renderFn.mock.lastCall?.flat()).toStrictEqual([
        { value: 'a', pendingFirst: false, done: false, error: undefined },
        { value: 'b', pendingFirst: false, done: false, error: undefined },
        { value: '___', pendingFirst: true, done: false, error: undefined },
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 3</div>`
      );
      expect(initialValueFn).toHaveBeenCalledTimes(3);
    }
  );

  it(
    gray(
      'When given multiple iterables with initial values as a functions, calls each once whenever a corresponding iterable is added'
    ),
    async () => {
      const channels = [new IteratorChannelTestHelper<string>()];
      const [initialValueFn1, initialValueFn2] = [vi.fn(), vi.fn()];
      const renderFn = vi.fn() as Mock<
        (nexts: IterationResultSet<AsyncIterable<string>[], ['_1_', '_2_']>) => any
      >;

      const Component = ({ values }: { values: AsyncIterable<string>[] }) => (
        <IterateMulti
          values={values}
          initialValues={[
            initialValueFn1.mockImplementation(() => '_1_'),
            initialValueFn2.mockImplementation(() => '_2_'),
          ]}
        >
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </IterateMulti>
      );

      const rendered = render(<></>);

      await act(() => rendered.rerender(<Component values={channels} />));
      expect(renderFn.mock.calls).lengthOf(1);
      expect(renderFn.mock.lastCall?.flat()).toStrictEqual([
        { value: '_1_', pendingFirst: true, done: false, error: undefined },
      ]);

      await act(() => channels[0].put('a'));
      expect(renderFn.mock.calls).lengthOf(2);
      expect(renderFn.mock.lastCall?.flat()).toStrictEqual([
        { value: 'a', pendingFirst: false, done: false, error: undefined },
      ]);

      await act(() => {
        channels.push(new IteratorChannelTestHelper());
        rendered.rerender(<Component values={channels} />);
      });
      expect(renderFn.mock.calls).lengthOf(3);
      expect(renderFn.mock.lastCall?.flat()).toStrictEqual([
        { value: 'a', pendingFirst: false, done: false, error: undefined },
        { value: '_2_', pendingFirst: true, done: false, error: undefined },
      ]);
      expect(initialValueFn1).toHaveBeenCalledOnce();
      expect(initialValueFn2).toHaveBeenCalledOnce();
    }
  );

  it(
    gray(
      "When given multiple iterables with corresponding initial values for some and a default initial value, correctly renders each's state and corresponding initial value or the default initial value if not present"
    ),
    async () => {
      const renderFn = vi.fn() as Mock<
        (
          nexts: IterationResultSet<[AsyncIterable<string>, AsyncIterable<string>], ['_1_'], '___'>
        ) => any
      >;
      const channels = [
        new IteratorChannelTestHelper<string>(),
        new IteratorChannelTestHelper<string>(),
      ] as const;

      const rendered = await act(() =>
        render(
          <IterateMulti values={channels} initialValues={['_1_']} defaultInitialValue="___">
            {renderFn.mockImplementation(() => (
              <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
            ))}
          </IterateMulti>
        )
      );

      await act(() => {});
      expect(renderFn.mock.calls).lengthOf(1);
      expect(renderFn.mock.lastCall?.flat()).toStrictEqual([
        { value: '_1_', pendingFirst: true, done: false, error: undefined },
        { value: '___', pendingFirst: true, done: false, error: undefined },
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 1</div>`
      );

      await act(() => channels[0].put('a'));
      expect(renderFn.mock.calls).lengthOf(2);
      expect(renderFn.mock.lastCall?.flat()).toStrictEqual([
        { value: 'a', pendingFirst: false, done: false, error: undefined },
        { value: '___', pendingFirst: true, done: false, error: undefined },
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 2</div>`
      );

      await act(() => channels[1].put('b'));
      expect(renderFn.mock.calls).lengthOf(3);
      expect(renderFn.mock.lastCall?.flat()).toStrictEqual([
        { value: 'a', pendingFirst: false, done: false, error: undefined },
        { value: 'b', pendingFirst: false, done: false, error: undefined },
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 3</div>`
      );
    }
  );

  describe(
    gray(
      "When given multiple iterables with corresponding initial values, correctly renders each's state and corresponding initial value if present"
    ),
    () => {
      it(gray('with initial values for all given iterables'), async () => {
        const renderFn = vi.fn() as Mock<
          (
            nexts: IterationResultSet<
              [AsyncIterable<'a' | 'b' | 'c'>, AsyncIterable<'a' | 'b' | 'c'>],
              ['_1_', '_2_']
            >
          ) => any
        >;
        const channels = [
          new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
          new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
        ] as const;

        const rendered = await act(() =>
          render(
            <IterateMulti values={channels} initialValues={['_1_', '_2_']}>
              {renderFn.mockImplementation(() => (
                <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
              ))}
            </IterateMulti>
          )
        );

        await act(() => {});
        expect(renderFn.mock.calls).lengthOf(1);
        expect(renderFn.mock.lastCall).toStrictEqual([
          [
            { value: '_1_', pendingFirst: true, done: false, error: undefined },
            { value: '_2_', pendingFirst: true, done: false, error: undefined },
          ],
        ]);
        expect(rendered.container.innerHTML).toStrictEqual(
          `<div id="test-created-elem">Render count: 1</div>`
        );

        await act(() => channels[0].put('a'));
        expect(renderFn.mock.calls).lengthOf(2);
        expect(renderFn.mock.lastCall).toStrictEqual([
          [
            { value: 'a', pendingFirst: false, done: false, error: undefined },
            { value: '_2_', pendingFirst: true, done: false, error: undefined },
          ],
        ]);
        expect(rendered.container.innerHTML).toStrictEqual(
          `<div id="test-created-elem">Render count: 2</div>`
        );

        await act(() => channels[1].put('b'));
        expect(renderFn.mock.calls).lengthOf(3);
        expect(renderFn.mock.lastCall).toStrictEqual([
          [
            { value: 'a', pendingFirst: false, done: false, error: undefined },
            { value: 'b', pendingFirst: false, done: false, error: undefined },
          ],
        ]);
        expect(rendered.container.innerHTML).toStrictEqual(
          `<div id="test-created-elem">Render count: 3</div>`
        );
      });

      it(gray('with initial values only for some given iterables'), async () => {
        const renderFn = vi.fn() as Mock<
          (
            nexts: IterationResultSet<
              [AsyncIterable<'a' | 'b' | 'c'>, AsyncIterable<'a' | 'b' | 'c'>],
              ['_1_']
            >
          ) => any
        >;
        const channels = [
          new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
          new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
        ] as const;

        const rendered = await act(() =>
          render(
            <IterateMulti values={channels} initialValues={['_1_']}>
              {renderFn.mockImplementation(() => (
                <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
              ))}
            </IterateMulti>
          )
        );

        await act(() => {});
        expect(renderFn.mock.calls).lengthOf(1);
        expect(renderFn.mock.lastCall).toStrictEqual([
          [
            { value: '_1_', pendingFirst: true, done: false, error: undefined },
            { value: undefined, pendingFirst: true, done: false, error: undefined },
          ],
        ]);
        expect(rendered.container.innerHTML).toStrictEqual(
          `<div id="test-created-elem">Render count: 1</div>`
        );

        await act(() => channels[0].put('a'));
        expect(renderFn.mock.calls).lengthOf(2);
        expect(renderFn.mock.lastCall).toStrictEqual([
          [
            { value: 'a', pendingFirst: false, done: false, error: undefined },
            { value: undefined, pendingFirst: true, done: false, error: undefined },
          ],
        ]);
        expect(rendered.container.innerHTML).toStrictEqual(
          `<div id="test-created-elem">Render count: 2</div>`
        );

        await act(() => channels[1].put('b'));
        expect(renderFn.mock.calls).lengthOf(3);
        expect(renderFn.mock.lastCall).toStrictEqual([
          [
            { value: 'a', pendingFirst: false, done: false, error: undefined },
            { value: 'b', pendingFirst: false, done: false, error: undefined },
          ],
        ]);
        expect(rendered.container.innerHTML).toStrictEqual(
          `<div id="test-created-elem">Render count: 3</div>`
        );
      });
    }
  );

  describe(
    gray(
      "When given multiple iterables that complete at different times, correctly renders each's state"
    ),
    () =>
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
            const renderFn = vi.fn() as Mock<
              (
                nexts: IterationResultSet<
                  [AsyncIterable<'a' | 'b' | 'c'>, AsyncIterable<'a' | 'b' | 'c'>],
                  string[]
                >
              ) => any
            >;
            const channels = [
              new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
              new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
            ] as const;

            const rendered = await act(() =>
              render(
                <IterateMulti values={channels} initialValues={initialValues}>
                  {renderFn.mockImplementation(() => (
                    <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
                  ))}
                </IterateMulti>
              )
            );

            await act(() => {});
            expect(renderFn.mock.calls).lengthOf(1);
            expect(renderFn.mock.lastCall).toStrictEqual([
              [
                { value: initialValues[0], pendingFirst: true, done: false, error: undefined },
                { value: initialValues[1], pendingFirst: true, done: false, error: undefined },
              ],
            ]);
            expect(rendered.container.innerHTML).toStrictEqual(
              `<div id="test-created-elem">Render count: 1</div>`
            );

            await act(() => channels[0].put('a'));
            expect(renderFn.mock.calls).lengthOf(2);
            expect(renderFn.mock.lastCall).toStrictEqual([
              [
                { value: 'a', pendingFirst: false, done: false, error: undefined },
                { value: initialValues[1], pendingFirst: true, done: false, error: undefined },
              ],
            ]);
            expect(rendered.container.innerHTML).toStrictEqual(
              `<div id="test-created-elem">Render count: 2</div>`
            );

            await act(() => channels[1].complete());
            expect(renderFn.mock.calls).lengthOf(3);
            expect(renderFn.mock.lastCall).toStrictEqual([
              [
                { value: 'a', pendingFirst: false, done: false, error: undefined },
                { value: initialValues[1], pendingFirst: false, done: true, error: undefined },
              ],
            ]);
            expect(rendered.container.innerHTML).toStrictEqual(
              `<div id="test-created-elem">Render count: 3</div>`
            );

            await act(() => channels[0].complete());
            expect(renderFn.mock.calls).lengthOf(4);
            expect(renderFn.mock.lastCall).toStrictEqual([
              [
                { value: 'a', pendingFirst: false, done: true, error: undefined },
                { value: initialValues[1], pendingFirst: false, done: true, error: undefined },
              ],
            ]);
            expect(rendered.container.innerHTML).toStrictEqual(
              `<div id="test-created-elem">Render count: 4</div>`
            );
          }
        );
      })
  );

  describe(
    gray(
      "When given multiple iterables that error out at different times, correctly renders each's state"
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
            const renderFn = vi.fn() as Mock<
              (
                nexts: IterationResultSet<
                  [AsyncIterable<'a' | 'b' | 'c'>, AsyncIterable<'a' | 'b' | 'c'>],
                  string[]
                >
              ) => any
            >;
            const channels = [
              new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
              new IteratorChannelTestHelper<'a' | 'b' | 'c'>(),
            ] as const;

            const rendered = await act(() =>
              render(
                <IterateMulti values={channels} initialValues={initialValues}>
                  {renderFn.mockImplementation(() => (
                    <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
                  ))}
                </IterateMulti>
              )
            );

            await act(() => {});
            expect(renderFn.mock.calls).lengthOf(1);
            expect(renderFn.mock.lastCall).toStrictEqual([
              [
                { value: initialValues[0], pendingFirst: true, done: false, error: undefined },
                { value: initialValues[1], pendingFirst: true, done: false, error: undefined },
              ],
            ]);
            expect(rendered.container.innerHTML).toStrictEqual(
              `<div id="test-created-elem">Render count: 1</div>`
            );

            await act(() => channels[0].put('a'));
            expect(renderFn.mock.calls).lengthOf(2);
            expect(renderFn.mock.lastCall).toStrictEqual([
              [
                { value: 'a', pendingFirst: false, done: false, error: undefined },
                { value: initialValues[1], pendingFirst: true, done: false, error: undefined },
              ],
            ]);
            expect(rendered.container.innerHTML).toStrictEqual(
              `<div id="test-created-elem">Render count: 2</div>`
            );

            await act(() => channels[1].error(simulatedError1));
            expect(renderFn.mock.calls).lengthOf(3);
            expect(renderFn.mock.lastCall).toStrictEqual([
              [
                { value: 'a', pendingFirst: false, done: false, error: undefined },
                {
                  value: initialValues[1],
                  pendingFirst: false,
                  done: true,
                  error: simulatedError1,
                },
              ],
            ]);
            expect(rendered.container.innerHTML).toStrictEqual(
              `<div id="test-created-elem">Render count: 3</div>`
            );

            await act(() => channels[0].error(simulatedError2));
            expect(renderFn.mock.calls).lengthOf(4);
            expect(renderFn.mock.lastCall).toStrictEqual([
              [
                { value: 'a', pendingFirst: false, done: true, error: simulatedError2 },
                {
                  value: initialValues[1],
                  pendingFirst: false,
                  done: true,
                  error: simulatedError1,
                },
              ],
            ]);
            expect(rendered.container.innerHTML).toStrictEqual(
              `<div id="test-created-elem">Render count: 4</div>`
            );
          }
        );
      });
    }
  );

  it(
    gray(
      "When consecutively updated with new iterables will close the previous ones' iterator every time and render with their all states accordingly"
    ),
    async () => {
      const renderFn = vi.fn() as Mock<
        (nexts: IterationResultSet<[AsyncIterable<string>, AsyncIterable<string>]>) => any
      >;
      let channel1 = new IteratorChannelTestHelper<string>();
      let channel2 = new IteratorChannelTestHelper<string>();
      const origChannel1ReturnSpy = channel1.return;
      const origChannel2ReturnSpy = channel2.return;

      const Component = (props: { values: [AsyncIterable<string>, AsyncIterable<string>] }) => (
        <IterateMulti values={props.values}>
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </IterateMulti>
      );

      const rendered = render(<></>);

      await act(() => rendered.rerender(<Component values={[channel1, channel2]} />));
      expect(renderFn.mock.calls).lengthOf(1);
      expect(origChannel1ReturnSpy).not.toHaveBeenCalled();
      expect(origChannel2ReturnSpy).not.toHaveBeenCalled();
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: undefined, pendingFirst: true, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ],
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 1</div>`
      );

      await act(() => channel1.put('a'));
      expect(renderFn.mock.calls).lengthOf(2);
      expect(origChannel1ReturnSpy).not.toHaveBeenCalled();
      expect(origChannel2ReturnSpy).not.toHaveBeenCalled();
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'a', pendingFirst: false, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ],
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 2</div>`
      );

      await act(() => {
        channel1 = new IteratorChannelTestHelper();
        rendered.rerender(<Component values={[channel1, channel2]} />);
      });
      expect(renderFn.mock.calls).lengthOf(3);
      expect(origChannel1ReturnSpy).toHaveBeenCalledOnce();
      expect(origChannel2ReturnSpy).not.toHaveBeenCalled();
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'a', pendingFirst: true, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ],
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 3</div>`
      );

      await act(() => {
        channel2 = new IteratorChannelTestHelper();
        rendered.rerender(<Component values={[channel1, channel2]} />);
      });
      expect(renderFn.mock.calls).lengthOf(4);
      expect(origChannel1ReturnSpy).toHaveBeenCalledOnce();
      expect(origChannel2ReturnSpy).toHaveBeenCalledOnce();
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'a', pendingFirst: true, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ],
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 4</div>`
      );

      await act(() => channel1.put('b'));
      expect(renderFn.mock.calls).lengthOf(5);
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'b', pendingFirst: false, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ],
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 5</div>`
      );
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
              const renderFn = vi.fn() as Mock<
                (nexts: IterationResultSet<AsyncIterable<string>[]>) => any
              >;
              const [channel1, channel2] = ['a_current', 'b_current'].map(current =>
                Object.assign(new IteratorChannelTestHelper<string>(), {
                  value: { current },
                })
              );

              const Component = (props: { values: AsyncIterable<string>[] }) => (
                <IterateMulti values={props.values}>
                  {renderFn.mockImplementation(() => (
                    <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
                  ))}
                </IterateMulti>
              );

              const rendered = render(<></>);
              const renderedHtmls = [];

              for (const run of [
                () => act(() => rendered.rerender(<Component values={[channel1]} />)),
                () => act(() => channel1.put('a')),
                () =>
                  act(() =>
                    rendered.rerender(
                      <Component
                        values={[
                          iterateFormatted(channel2, (val, i) => `${val}_formatted_${i}`),
                          channel1,
                        ]}
                      />
                    )
                  ),
                () => act(() => channel2.put('b')),
              ]) {
                await run();
                renderedHtmls.push(rendered.container.innerHTML);
              }

              expect(renderFn.mock.calls.flat()).toStrictEqual([
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
              expect(renderedHtmls).toStrictEqual([
                '<div id="test-created-elem">Render count: 1</div>',
                '<div id="test-created-elem">Render count: 2</div>',
                '<div id="test-created-elem">Render count: 3</div>',
                '<div id="test-created-elem">Render count: 4</div>',
              ]);
            }
          );
        }
      )
  );

  it(gray('When unmounted will close all active iterators it has been holding'), async () => {
    const renderFn = vi.fn() as Mock<
      (
        nexts: IterationResultSet<[AsyncIterable<'a' | 'b' | 'c'>, AsyncIterable<'a' | 'b' | 'c'>]>
      ) => any
    >;
    const channel1 = new IteratorChannelTestHelper<'a' | 'b' | 'c'>();
    const channel2 = new IteratorChannelTestHelper<'a' | 'b' | 'c'>();

    const Component = (props: {
      values: [AsyncIterable<'a' | 'b' | 'c'>, AsyncIterable<'a' | 'b' | 'c'>];
    }) => (
      <IterateMulti values={props.values}>
        {renderFn.mockImplementation(() => (
          <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
        ))}
      </IterateMulti>
    );

    const rendered = render(<></>);

    {
      await act(() => rendered.rerender(<Component values={[channel1, channel2]} />));
      expect(channel1.return).not.toHaveBeenCalled();
      expect(channel2.return).not.toHaveBeenCalled();
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: undefined, pendingFirst: true, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ],
      ]);

      await act(() => channel1.put('a'));
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'a', pendingFirst: false, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ],
      ]);
    }

    {
      rendered.unmount();
      expect(channel1.return).toHaveBeenCalledOnce();
      expect(channel2.return).toHaveBeenCalledOnce();
    }
  });

  it(
    gray(
      'When adding / removing / swapping positions of iterables, their ongoing states are maintained at every step regardless of position get closed only when they disappear altogether from passed array'
    ),
    async () => {
      const renderFn = vi.fn() as Mock<
        (nexts: IterationResultSet<(string | AsyncIterable<string>)[]>) => any
      >;
      const values: (string | IteratorChannelTestHelper<string>)[] = [];

      const channelA = new IteratorChannelTestHelper<string>();
      const channelB = new IteratorChannelTestHelper<string>();
      const channelC = new IteratorChannelTestHelper<string>();

      const Component = (props: { values: (string | AsyncIterable<string>)[] }) => (
        <IterateMulti values={props.values}>
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </IterateMulti>
      );

      const rendered = render(<></>);

      await act(() => {
        values.push(channelA);
        rendered.rerender(<Component values={values} />);
      });
      expect(renderFn.mock.lastCall).toStrictEqual([
        [{ value: undefined, pendingFirst: true, done: false, error: undefined }],
      ]);

      await act(() => {
        values.push(channelB);
        rendered.rerender(<Component values={values} />);
      });
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: undefined, pendingFirst: true, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ],
      ]);

      await act(() => {
        values.push(channelC);
        rendered.rerender(<Component values={values} />);
      });
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: undefined, pendingFirst: true, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ],
      ]);

      await act(() => channelA.put('a_from_iter'));
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ],
      ]);

      await act(() => channelB.put('b_from_iter'));
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: 'b_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ],
      ]);

      await act(() => channelC.put('c_from_iter'));
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: 'b_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: 'c_from_iter', pendingFirst: false, done: false, error: undefined },
        ],
      ]);

      await act(() => {
        values.push('d_static', 'e_static', 'f_static');
        rendered.rerender(<Component values={values} />);
      });
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: 'b_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: 'c_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: 'd_static', pendingFirst: false, done: false, error: undefined },
          { value: 'e_static', pendingFirst: false, done: false, error: undefined },
          { value: 'f_static', pendingFirst: false, done: false, error: undefined },
        ],
      ]);

      await act(() => {
        values.reverse();
        rendered.rerender(<Component values={values} />);
      });
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'f_static', pendingFirst: false, done: false, error: undefined },
          { value: 'e_static', pendingFirst: false, done: false, error: undefined },
          { value: 'd_static', pendingFirst: false, done: false, error: undefined },
          { value: 'c_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: 'b_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
        ],
      ]);

      await act(() => {
        values.splice(0, 3);
        rendered.rerender(<Component values={values} />);
      });
      expect(channelC.return).not.toHaveBeenCalled();
      expect(channelB.return).not.toHaveBeenCalled();
      expect(channelA.return).not.toHaveBeenCalled();
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'c_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: 'b_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
        ],
      ]);

      await act(() => {
        values.shift();
        rendered.rerender(<Component values={values} />);
      });
      expect(channelC.return).toHaveBeenCalledOnce();
      expect(channelB.return).not.toHaveBeenCalled();
      expect(channelA.return).not.toHaveBeenCalled();
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'b_from_iter', pendingFirst: false, done: false, error: undefined },
          { value: 'a_from_iter', pendingFirst: false, done: false, error: undefined },
        ],
      ]);

      await act(() => {
        values.shift();
        rendered.rerender(<Component values={values} />);
      });
      expect(channelC.return).toHaveBeenCalledOnce();
      expect(channelB.return).toHaveBeenCalledOnce();
      expect(channelA.return).not.toHaveBeenCalled();
      expect(renderFn.mock.lastCall).toStrictEqual([
        [{ value: 'a_from_iter', pendingFirst: false, done: false, error: undefined }],
      ]);

      await act(() => {
        values.shift();
        rendered.rerender(<Component values={values} />);
      });
      expect(channelC.return).toHaveBeenCalledOnce();
      expect(channelB.return).toHaveBeenCalledOnce();
      expect(channelA.return).toHaveBeenCalledOnce();
      expect(renderFn.mock.lastCall).toStrictEqual([[]]);
    }
  );

  it(
    gray(
      'If any given iterable yields consecutive identical values after the first, the component will not re-render'
    ),
    async () => {
      const renderFn = vi.fn() as Mock<
        (nexts: IterationResultSet<[AsyncIterable<string>, AsyncIterable<string>]>) => any
      >;
      const channel1 = new IteratorChannelTestHelper<string>();
      const channel2 = new IteratorChannelTestHelper<string>();

      const rendered = await act(() =>
        render(
          <IterateMulti values={[channel1, channel2]}>
            {renderFn.mockImplementation(() => (
              <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
            ))}
          </IterateMulti>
        )
      );

      for (let i = 0; i < 3; ++i) {
        await act(() => (channel1.put('a'), channel2.put('b')));
        await act(() => channel1.put('a'));
        await act(() => channel2.put('b'));
      }

      expect(renderFn.mock.calls).lengthOf(2);
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'a', pendingFirst: false, done: false, error: undefined },
          { value: 'b', pendingFirst: false, done: false, error: undefined },
        ],
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 2</div>`
      );
    }
  );

  it(
    gray(
      "When given iterable's first yield is identical to the previous value, the component does re-render"
    ),
    async () => {
      const renderFn = vi.fn() as Mock<(nexts: IterationResultSet<[AsyncIterable<string>]>) => any>;
      const channel1 = new IteratorChannelTestHelper<string>();

      const Component = (props: { values: [AsyncIterable<string>] }) => {
        return (
          <IterateMulti values={props.values}>
            {renderFn.mockImplementation(() => (
              <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
            ))}
          </IterateMulti>
        );
      };

      const rendered = await act(() => render(<Component values={[channel1]} />));

      await act(() => channel1.put('a'));

      const channel2 = new IteratorChannelTestHelper<string>();
      await act(() => rendered.rerender(<Component values={[channel2]} />));
      expect(renderFn.mock.calls).lengthOf(3);
      expect(renderFn.mock.lastCall).toStrictEqual([
        [{ value: 'a', pendingFirst: true, done: false, error: undefined }],
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        '<div id="test-created-elem">Render count: 3</div>'
      );

      await act(() => channel2.put('a'));
      expect(renderFn.mock.calls).lengthOf(4);
      expect(renderFn.mock.lastCall).toStrictEqual([
        [{ value: 'a', pendingFirst: false, done: false, error: undefined }],
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        '<div id="test-created-elem">Render count: 4</div>'
      );
    }
  );

  it(
    gray(
      'When given rapid-yielding iterables, consecutive values are batched into a single render that takes only the most recent values'
    ),
    async () => {
      const renderFn = vi.fn() as Mock<
        (
          nexts: IterationResultSet<
            [
              string,
              AsyncIterable<string>,
              AsyncIterable<string>,
              AsyncIterable<string>,
              AsyncIterable<string>,
            ]
          >
        ) => any
      >;
      const values = [
        'a',
        asyncIterOf('b'),
        asyncIterOf('_1', 'c'),
        asyncIterOf('_1', '_2', 'd'),
        asyncIterOf('_1', '_2', '_3', 'e'),
      ] as const;

      const rendered = await act(() =>
        render(
          <IterateMulti values={values}>
            {renderFn.mockImplementation(() => (
              <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
            ))}
          </IterateMulti>
        )
      );

      expect(renderFn.mock.calls).lengthOf(2);
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: 'a', pendingFirst: false, done: false, error: undefined },
          { value: 'b', pendingFirst: false, done: true, error: undefined },
          { value: 'c', pendingFirst: false, done: true, error: undefined },
          { value: 'd', pendingFirst: false, done: true, error: undefined },
          { value: 'e', pendingFirst: false, done: true, error: undefined },
        ],
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 2</div>`
      );
    }
  );

  it(
    gray(
      'When given `ReactAsyncIterables`, maintains the iteration states based on the original source iters they contain and applies the next given format functions correctly'
    ),
    async () => {
      const renderFn = vi.fn() as Mock<(nexts: IterationResultSet<AsyncIterable<string>[]>) => any>;
      const channel1 = new IteratorChannelTestHelper<string>();
      const channel2 = new IteratorChannelTestHelper<string>();

      const Component = () => (
        <IterateMulti
          values={[channel1, channel2].map(ch =>
            pipe(
              ch,
              $ => iterateFormatted($, (val, i) => `${val} >> formatted once (idx: ${i})`),
              $ => iterateFormatted($, (val, i) => `${val} >> and formatted twice (idx: ${i})`)
            )
          )}
        >
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </IterateMulti>
      );

      const rendered = render(<></>);

      for (let i = 0; i < 3; ++i) {
        await act(() => rendered.rerender(<Component />));
      }
      expect(channel1.return).not.toHaveBeenCalled();
      expect(channel2.return).not.toHaveBeenCalled();

      await act(() => channel1.put('a'));
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          {
            value: 'a >> formatted once (idx: 0) >> and formatted twice (idx: 0)',
            pendingFirst: false,
            done: false,
            error: undefined,
          },
          { value: undefined, pendingFirst: true, done: false, error: undefined },
        ],
      ]);

      await act(() => channel2.put('b'));
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
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
        ],
      ]);

      await act(() => (channel1.put('a'), channel2.put('b')));
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
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
        ],
      ]);
    }
  );

  it(
    gray(
      'When given `ReactAsyncIterable`s yielding `undefined`s or `null`s that wrap iters which originally yield non-nullable values, renders with the `undefined`s and `null`s in the results as expected'
    ),
    async () => {
      const renderFn = vi.fn() as Mock<
        (
          nexts: IterationResultSet<
            [AsyncIterable<string | null | undefined>, AsyncIterable<string | null | undefined>]
          >
        ) => any
      >;
      const channel1 = new IteratorChannelTestHelper<string>();
      const channel2 = new IteratorChannelTestHelper<string>();

      const Component = (props: { formatInto: string | null | undefined }) => (
        <IterateMulti
          values={[
            iterateFormatted(channel1, _ => props.formatInto),
            iterateFormatted(channel2, _ => props.formatInto),
          ]}
        >
          {renderFn.mockImplementation(() => (
            <div id="test-created-elem">Render count: {renderFn.mock.calls.length}</div>
          ))}
        </IterateMulti>
      );

      const rendered = render(<Component formatInto="" />);

      await act(() => {
        channel1.put('a');
        channel2.put('a');
        rendered.rerender(<Component formatInto={null} />);
      });
      expect(renderFn.mock.calls).lengthOf(3);
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: null, pendingFirst: false, done: false, error: undefined },
          { value: null, pendingFirst: false, done: false, error: undefined },
        ],
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 3</div>`
      );

      await act(() => {
        channel1.put('b');
        channel2.put('b');
        rendered.rerender(<Component formatInto={undefined} />);
      });
      expect(renderFn.mock.calls).lengthOf(5);
      expect(renderFn.mock.lastCall).toStrictEqual([
        [
          { value: undefined, pendingFirst: false, done: false, error: undefined },
          { value: undefined, pendingFirst: false, done: false, error: undefined },
        ],
      ]);
      expect(rendered.container.innerHTML).toStrictEqual(
        `<div id="test-created-elem">Render count: 5</div>`
      );
    }
  );
});

const simulatedError1 = new Error('🚨 Simulated Error 1 🚨');
const simulatedError2 = new Error('🚨 Simulated Error 2 🚨');

type IterateMultiRenderFunc<
  TVals extends readonly unknown[],
  TInitVals extends readonly unknown[] = readonly undefined[],
> = IterateMultiProps<TVals, TInitVals>['children'];
