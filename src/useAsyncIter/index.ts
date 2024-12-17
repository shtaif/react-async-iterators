import { useRef, useMemo, useEffect } from 'react';
import { useLatest } from '../common/hooks/useLatest.js';
import { isAsyncIter } from '../common/isAsyncIter.js';
import { useSimpleRerender } from '../common/hooks/useSimpleRerender.js';
import { type ExtractAsyncIterValue } from '../common/ExtractAsyncIterValue.js';

export { useAsyncIter, type IterationResult };

// TODO: The initial value can be given as a function, which the internal `useState` would invoke as it's defined to do. So the typings should take into account it possibly being a function and if that's the case then to extract its return type instead of using the function type itself

const useAsyncIter: {
  <TValue>(
    input: AsyncIterable<TValue>,
    initialValue?: undefined
  ): IterationResult<TValue, undefined>;

  <TValue, TInitValue = undefined>(
    input: TValue,
    initialValue?: TInitValue
  ): IterationResult<TValue, TInitValue>;
} = <TValue, TInitValue = undefined>(
  input: TValue,
  initialValue: TInitValue
): IterationResult<TValue, TInitValue> => {
  const rerender = useSimpleRerender();

  const stateRef = useRef<IterationResult<TValue, TInitValue>>({
    value: initialValue,
    pendingFirst: true,
    done: false,
    error: undefined,
  });

  const latestInputRef = useLatest(input);

  if (!isAsyncIter(latestInputRef.current)) {
    useMemo(() => {}, [undefined]);
    useEffect(() => {}, [undefined]);

    return (stateRef.current = {
      value: latestInputRef.current as ExtractAsyncIterValue<TValue>,
      pendingFirst: false,
      done: false,
      error: undefined,
    });
  } else {
    useMemo(() => {
      stateRef.current = {
        value: stateRef.current.value,
        pendingFirst: true,
        done: false,
        error: undefined,
      };
    }, [latestInputRef.current]);

    useEffect(() => {
      const iterator = (latestInputRef.current as AsyncIterable<ExtractAsyncIterValue<TValue>>)[
        Symbol.asyncIterator
      ]();
      let iteratorClosedAbruptly = false;

      (async () => {
        try {
          for await (const value of { [Symbol.asyncIterator]: () => iterator }) {
            if (!iteratorClosedAbruptly) {
              stateRef.current = {
                value,
                pendingFirst: false,
                done: false,
                error: undefined,
              };
              rerender();
            }
          }
          if (!iteratorClosedAbruptly) {
            stateRef.current = {
              value: stateRef.current.value,
              pendingFirst: false,
              done: true,
              error: undefined,
            };
            rerender();
          }
        } catch (err) {
          if (!iteratorClosedAbruptly) {
            stateRef.current = {
              value: stateRef.current.value,
              pendingFirst: false,
              done: true,
              error: err,
            };
            rerender();
          }
        }
      })();

      return () => {
        iteratorClosedAbruptly = true;
        iterator.return?.();
      };
    }, [latestInputRef.current]);

    return stateRef.current;
  }
};

type IterationResult<TValue, TInitValue = undefined> = {
  /** The most recent value received */
  value: ExtractAsyncIterValue<TValue> | TInitValue;
} & (
  | {
      pendingFirst: true;
      done: false;
      error: undefined;
    }
  | ({
      pendingFirst: false;
    } & (
      | {
          done: false;
          error: undefined;
        }
      | {
          done: true;
          error: unknown;
        }
    ))
);
