import { useAsyncIter, type IterationResult } from './useAsyncIter/index.js';
import { useAsyncIterMulti, type IterationResultSet } from './useAsyncIterMulti/index.js';
import { Iterate, type IterateProps } from './Iterate/index.js';
import { IterateMulti, type IterateMultiProps } from './IterateMulti/index.js';
import { iterateFormatted } from './iterateFormatted/index.js';
import { useAsyncIterState, type AsyncIterStateResult } from './useAsyncIterState/index.js';
import { useAsyncIterMemo } from './useAsyncIterMemo/index.js';
import { type MaybeAsyncIterable } from './MaybeAsyncIterable/index.js';
import { type ReactAsyncIterable } from './common/ReactAsyncIterable.js';
import { type AsyncIterableSubject } from './AsyncIterableSubject/index.js';

export {
  useAsyncIter,
  type IterationResult,
  useAsyncIterMulti,
  type IterationResultSet,
  Iterate,
  Iterate as It,
  type IterateProps,
  IterateMulti,
  IterateMulti as ItMulti,
  type IterateMultiProps,
  iterateFormatted,
  useAsyncIterState,
  type AsyncIterStateResult,
  type MaybeAsyncIterable,
  useAsyncIterMemo,
  type ReactAsyncIterable,
  type AsyncIterableSubject,

  /**
   * @deprecated use {@link ReactAsyncIterable `ReactAsyncIterable`} instead.
   * */
  type ReactAsyncIterable as FixedRefFormattedIterable,
};
