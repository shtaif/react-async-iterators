import { it, describe, expect, afterEach, vi } from 'vitest';
import { gray } from 'colorette';
import { render, cleanup as cleanupMountedReactTrees, act } from '@testing-library/react';
import { iterateFormatted, Iterate } from '../../src/index.js';
import { pipe } from '../utils/pipe.js';
import { asyncIterToArray } from '../utils/asyncIterToArray.js';
import { IterableChannelTestHelper } from '../utils/IterableChannelTestHelper.js';

afterEach(() => {
  cleanupMountedReactTrees();
});

describe('`iterateFormatted` function', () => {
  it(gray('When called on some plain value it formats and returns that on the spot'), () => {
    const multiFormattedPlainValue = pipe(
      'a',
      $ => iterateFormatted($, (value, i) => `${value} formatted once (idx: ${i})`),
      $ => iterateFormatted($, (value, i) => `${value} and formatted twice (idx: ${i})`)
    );
    expect(multiFormattedPlainValue).toStrictEqual(
      'a formatted once (idx: 0) and formatted twice (idx: 0)'
    );
  });

  it(
    gray(
      'When the resulting object is iterated manually (without the library tools) it still has the provided formatting applied'
    ),
    async () => {
      const multiFormattedIter = pipe(
        (async function* () {
          yield* ['a', 'b', 'c'];
        })(),
        $ => iterateFormatted($, (value, i) => `${value} formatted once (idx: ${i})`),
        $ => iterateFormatted($, (value, i) => `${value} and formatted twice (idx: ${i})`)
      );

      const yielded = await asyncIterToArray(multiFormattedIter);

      expect(yielded).toStrictEqual([
        'a formatted once (idx: 0) and formatted twice (idx: 0)',
        'b formatted once (idx: 1) and formatted twice (idx: 1)',
        'c formatted once (idx: 2) and formatted twice (idx: 2)',
      ]);
    }
  );

  it(
    gray(
      'When the wrapped source is used normally with library tools it is rendered and formatted correctly'
    ),
    async () => {
      const channel = new IterableChannelTestHelper<string>();

      const rendered = render(
        <Iterate
          value={pipe(
            channel,
            $ => iterateFormatted($, (value, i) => `${value} formatted once (idx: ${i})`),
            $ => iterateFormatted($, (value, i) => `${value} and formatted twice (idx: ${i})`)
          )}
        >
          {next => <p>Rendered: {next.value}</p>}
        </Iterate>
      );

      expect(rendered.container.innerHTML).toStrictEqual('<p>Rendered: </p>');

      for (const [i, value] of ['a', 'b', 'c'].entries()) {
        await act(() => channel.put(value));
        expect(rendered.container.innerHTML).toStrictEqual(
          `<p>Rendered: ${value} formatted once (idx: ${i}) and formatted twice (idx: ${i})</p>`
        );
      }
    }
  );

  it(
    gray(
      'When re-rendering with a new wrapped iterable each time, as long as they wrap the same source iterable, the same source iteration process will persist across these re-renderings'
    ),
    async () => {
      const [channel1, channel2] = [
        new IterableChannelTestHelper<string>(),
        new IterableChannelTestHelper<string>(),
      ];

      const [channelReturnSpy1, channelReturnSpy2] = [
        vi.spyOn(channel1, 'return'),
        vi.spyOn(channel2, 'return'),
      ];

      const rebuildTestContent = (it: AsyncIterable<string>) => (
        <Iterate
          value={pipe(
            it,
            $ => iterateFormatted($, (value, i) => `${value} formatted once (idx: ${i})`),
            $ => iterateFormatted($, (value, i) => `${value} and formatted twice (idx: ${i})`)
          )}
        >
          {next => <p>Rendered: {next.value}</p>}
        </Iterate>
      );

      const rendered = render(<></>);

      rendered.rerender(rebuildTestContent(channel1));
      expect(channelReturnSpy1).not.toHaveBeenCalled();

      rendered.rerender(rebuildTestContent(channel1));
      expect(channelReturnSpy1).not.toHaveBeenCalled();

      rendered.rerender(rebuildTestContent(channel2));
      expect(channelReturnSpy1).toHaveBeenCalledOnce();
      expect(channelReturnSpy2).not.toHaveBeenCalled();

      rendered.rerender(rebuildTestContent(channel2));
      expect(channelReturnSpy2).not.toHaveBeenCalled();
    }
  );

  it(
    gray(
      'Always the latest closure passed in as the format function will be the one to format the next-arriving source value'
    ),
    async () => {
      const channel = new IterableChannelTestHelper<string>();

      const Wrapper = (props: { outerValue: string }) => (
        <Iterate
          value={pipe(
            channel,
            $ =>
              iterateFormatted(
                $,
                (value, i) => `${value} formatted once (idx: ${i}, outer val: ${props.outerValue})`
              ),
            $ =>
              iterateFormatted(
                $,
                (value, i) =>
                  `${value} and formatted twice (idx: ${i}, outer val: ${props.outerValue})`
              )
          )}
        >
          {next => <p>Rendered: {next.value}</p>}
        </Iterate>
      );

      const rendered = render(<></>);

      for (const [i, [nextYield, nextProp]] of [
        ['yield_a', 'prop_a'],
        ['yield_b', 'prop_b'],
        ['yield_c', 'prop_c'],
      ].entries()) {
        rendered.rerender(<Wrapper outerValue={nextProp} />);
        await act(() => channel.put(nextYield));

        expect(rendered.container.innerHTML).toStrictEqual(
          `<p>Rendered: ${nextYield} formatted once (idx: ${i}, outer val: ${nextProp}) and formatted twice (idx: ${i}, outer val: ${nextProp})</p>`
        );
      }
    }
  );
});
