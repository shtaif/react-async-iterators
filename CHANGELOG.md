## [0.5.0](https://github.com/shtaif/react-async-iterators/compare/v0.4.1...v0.5.0) (2025-01-08)


### Features

* implement the new `<IterateMulti>` component ([#39](https://github.com/shtaif/react-async-iterators/issues/39)) ([18997f8](https://github.com/shtaif/react-async-iterators/commit/18997f803dbecbf8cf959891ee1a6698b3f3f8a1))
* **useAsyncIterState:** add a current value property on `useAsyncIterState` hook's returned iterable ([#41](https://github.com/shtaif/react-async-iterators/issues/41)) ([6e1a36b](https://github.com/shtaif/react-async-iterators/commit/6e1a36b090bc5028499b50fe99e9019b0dc1f90c))


### Documentation

* various JSDocs blocks edits ([#38](https://github.com/shtaif/react-async-iterators/issues/38)) ([b313438](https://github.com/shtaif/react-async-iterators/commit/b3134383ebe3d83e596f47a32b4546ca140d3029))

## [0.4.1](https://github.com/shtaif/react-async-iterators/compare/v0.4.0...v0.4.1) (2025-01-07)


### Bug Fixes

* first yielding wrongly ignored if yielded value is identical to the last one stored before ([#36](https://github.com/shtaif/react-async-iterators/issues/36)) ([23ad98c](https://github.com/shtaif/react-async-iterators/commit/23ad98c6240469b3b0ad131be5c9f64e3c8a8d6b))

## [0.4.0](https://github.com/shtaif/react-async-iterators/compare/v0.3.0...v0.4.0) (2025-01-06)


### Features

* add to package exports the `IterationResultSet` type returned from `useAsyncIterMulti` ([#33](https://github.com/shtaif/react-async-iterators/issues/33)) ([b0c8899](https://github.com/shtaif/react-async-iterators/commit/b0c889982948277f9520e02fadb2a3d6c4797855))
* implement the new `useAsyncIterMulti` hook ([#28](https://github.com/shtaif/react-async-iterators/issues/28)) ([d813fa0](https://github.com/shtaif/react-async-iterators/commit/d813fa0afbcccc89ffc1eec414d9c474e0f3f977))


### Bug Fixes

* `ReactAsyncIterable`s wrapping iters which yield non-nullable values are having the format function's result ignored if it returned `undefined` or `null` ([#32](https://github.com/shtaif/react-async-iterators/issues/32)) ([828d872](https://github.com/shtaif/react-async-iterators/commit/828d87239f3d9a634a48d40f615ad77c70e6e02c))


### Documentation

* various docs edits ([#31](https://github.com/shtaif/react-async-iterators/issues/31)) ([3f08461](https://github.com/shtaif/react-async-iterators/commit/3f08461bab91fe5700f41267b772c2f8f149425b))

## [0.3.0](https://github.com/shtaif/react-async-iterators/compare/v0.2.0...v0.3.0) (2025-01-05)


### Features

* add a convenience alias export `<It>` for `<Iterate>` ([#19](https://github.com/shtaif/react-async-iterators/issues/19)) ([679cb23](https://github.com/shtaif/react-async-iterators/commit/679cb23b682d5cc24cc138546cd6e78329ae9542))
* add an exposed `MaybeAsyncIterable` helper generic type ([#25](https://github.com/shtaif/react-async-iterators/issues/25)) ([dd06927](https://github.com/shtaif/react-async-iterators/commit/dd069273489ae9b04cf47e3e885d1ee9073690cb))
* make `useAsyncIterState` iterable's type more accurate ([#23](https://github.com/shtaif/react-async-iterators/issues/23)) ([bd75364](https://github.com/shtaif/react-async-iterators/commit/bd75364ebd4a4127b0d1dd774b020a5e71791246))


### Bug Fixes

* `<Iterate>` render function parameter typing not inferring correctly in conjunction with `initialValue` with plain values semantics ([#24](https://github.com/shtaif/react-async-iterators/issues/24)) ([fe45bbb](https://github.com/shtaif/react-async-iterators/commit/fe45bbb452670b86c396375c21755f2e16f6385d))
* make iterators of the `useAsyncIterState` hook's iterable individually closable to prevent leaving around unsettled promises ([#22](https://github.com/shtaif/react-async-iterators/issues/22)) ([25e1ab5](https://github.com/shtaif/react-async-iterators/commit/25e1ab5b93211e5b87f562e92f4560f2d4159d0c))
* yielding consecutive identical values causes unnecessary re-renders for `useAsyncIter` and `<Iterate>` in misalignment with `React.useState` ([#21](https://github.com/shtaif/react-async-iterators/issues/21)) ([2a35f72](https://github.com/shtaif/react-async-iterators/commit/2a35f728062c2e70dda3d9510f8a9fa9c20987d5))


### Refactor

* fix import path of `iterateFormatted` on package's public export ([#17](https://github.com/shtaif/react-async-iterators/issues/17)) ([f3481e6](https://github.com/shtaif/react-async-iterators/commit/f3481e6d1373324bd0e73d809b27d0c6ac4e00dd))
* various misc refactorings ([#26](https://github.com/shtaif/react-async-iterators/issues/26)) ([20af9b0](https://github.com/shtaif/react-async-iterators/commit/20af9b0216084988866fbef6e671f8d6bda287f1))


### Tests

* add tests for rapid yielding iterables value batching for `useAsyncIter` and `<Iterate>` ([#20](https://github.com/shtaif/react-async-iterators/issues/20)) ([ebcbfd4](https://github.com/shtaif/react-async-iterators/commit/ebcbfd45ba27d0bd2151bf9e5469a018db24e3dd))

## [0.2.0](https://github.com/shtaif/react-async-iterators/compare/v0.1.0...v0.2.0) (2024-12-25)


### Features

* add new `useAsyncIterState` hook ([#16](https://github.com/shtaif/react-async-iterators/issues/16)) ([f87bb48](https://github.com/shtaif/react-async-iterators/commit/f87bb488c3f3d659e6639b5ed01a20d0f9340aab))

## [0.1.0](https://github.com/shtaif/react-async-iterators/compare/v0.0.1...v0.1.0) (2024-12-24)


### Features

* implement `iterateFormatted` async iter value formatting helper ([#11](https://github.com/shtaif/react-async-iterators/issues/11)) ([dfc7ab7](https://github.com/shtaif/react-async-iterators/commit/dfc7ab7c0f25a6f3b0998a2580c84f4a93a52b35))


### Documentation

* add npm badge on `README.md` ([#15](https://github.com/shtaif/react-async-iterators/issues/15)) ([c58bdaa](https://github.com/shtaif/react-async-iterators/commit/c58bdaa1a3a6be5f45e7d7a4d8fe6be3278e74c0))
* edit for `<Iterate>`'s docs ([#13](https://github.com/shtaif/react-async-iterators/issues/13)) ([062d2c4](https://github.com/shtaif/react-async-iterators/commit/062d2c407a4bf0ffc1698e072cbcecac0ab9e096))
