import { useAsyncIter, type IterationResult } from './useAsyncIter/index.js';
import { useAsyncIterMulti, type IterationResultSet } from './useAsyncIterMulti/index.js';
import { Iterate, type IterateProps } from './Iterate/index.js';
import { iterateFormatted } from './iterateFormatted/index.js';
import { useAsyncIterState, type AsyncIterStateResult } from './useAsyncIterState/index.js';
import { type MaybeAsyncIterable } from './MaybeAsyncIterable/index.js';
import { type ReactAsyncIterable } from './common/ReactAsyncIterable.js';

export {
  useAsyncIter,
  type IterationResult,
  useAsyncIterMulti,
  type IterationResultSet,
  Iterate,
  Iterate as It,
  type IterateProps,
  iterateFormatted,
  useAsyncIterState,
  type AsyncIterStateResult,
  type MaybeAsyncIterable,
  type ReactAsyncIterable,

  /**
   * @deprecated use {@link ReactAsyncIterable `ReactAsyncIterable`} instead.
   * */
  type ReactAsyncIterable as FixedRefFormattedIterable,
};
