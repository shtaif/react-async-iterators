## [0.10.0](https://github.com/shtaif/react-async-iterators/compare/v0.9.2...v0.10.0) (2025-02-07)


### Features

* new `useSharedAsyncIter` hook ([#87](https://github.com/shtaif/react-async-iterators/issues/87)) ([b1568b5](https://github.com/shtaif/react-async-iterators/commit/b1568b56c5b389f6f172f119ed2b8d3d1c178d32))


### Documentation

* **readme:** add license badge ([#86](https://github.com/shtaif/react-async-iterators/issues/86)) ([e5e94dd](https://github.com/shtaif/react-async-iterators/commit/e5e94dd20894754c1301d231a23a544243c7054f))
* **readme:** fix StackBlitz link adjacent text ([#84](https://github.com/shtaif/react-async-iterators/issues/84)) ([08cd00b](https://github.com/shtaif/react-async-iterators/commit/08cd00bc0a821bd633350c64f471f1c6a42e67af))
* **readme:** various edits ([#81](https://github.com/shtaif/react-async-iterators/issues/81)) ([2c34532](https://github.com/shtaif/react-async-iterators/commit/2c3453223cca54f00ccce25a672055ac6eec54d8))

## [0.9.2](https://github.com/shtaif/react-async-iterators/compare/v0.9.1...v0.9.2) (2025-01-31)


### Bug Fixes

* **useAsyncIterState:** individual iterators types' `.return` method should not be optional ([#78](https://github.com/shtaif/react-async-iterators/issues/78)) ([ae5d546](https://github.com/shtaif/react-async-iterators/commit/ae5d5460bc8ee0d4f08ddde8b4b02222d68167b4))


### Documentation

* **readme:** edit some wordings, fix some code blocks rendered unformatted ([#77](https://github.com/shtaif/react-async-iterators/issues/77)) ([af888c9](https://github.com/shtaif/react-async-iterators/commit/af888c90273d36fc35ddf4e3a44afecb2391d0e3))

## [0.9.1](https://github.com/shtaif/react-async-iterators/compare/v0.9.0...v0.9.1) (2025-01-30)


### Documentation

* **readme:** more edits ([#75](https://github.com/shtaif/react-async-iterators/issues/75)) ([c0229fa](https://github.com/shtaif/react-async-iterators/commit/c0229fa2274b530ed48efd37163e7fc5af3cb9e4))

## [0.9.0](https://github.com/shtaif/react-async-iterators/compare/v0.8.0...v0.9.0) (2025-01-28)


### Features

* **ItMulti:** support for handling initializer functions as initial values ([#71](https://github.com/shtaif/react-async-iterators/issues/71)) ([4435461](https://github.com/shtaif/react-async-iterators/commit/4435461b664ebac6f6448228d0833e65ea2d3cf4))
* **useAsyncIterMulti:** support getting initial values as initializer functions ([#70](https://github.com/shtaif/react-async-iterators/issues/70)) ([57056b2](https://github.com/shtaif/react-async-iterators/commit/57056b2bc12e2f4a195b00b7514686d2348e5c1e))


### Documentation

* **readme:** various edits ([#74](https://github.com/shtaif/react-async-iterators/issues/74)) ([79d0834](https://github.com/shtaif/react-async-iterators/commit/79d083462efadf8b6393c2730a2cee4e26c47b88))
* various edits ([#72](https://github.com/shtaif/react-async-iterators/issues/72)) ([6f8da52](https://github.com/shtaif/react-async-iterators/commit/6f8da5202df10718300bf714dcf25b085887631e))

## [0.8.0](https://github.com/shtaif/react-async-iterators/compare/v0.7.1...v0.8.0) (2025-01-27)


### Features

* add default initial value parameters to `useAsyncIterMulti` and `IterateMulti` ([#69](https://github.com/shtaif/react-async-iterators/issues/69)) ([f5e214b](https://github.com/shtaif/react-async-iterators/commit/f5e214b1bbf57dfcd90f31fabb3d9f7a674bd12a))


### Documentation

* **readme:** fix documentation mistakes for `useAsyncIterMulti`'s options object argument ([#67](https://github.com/shtaif/react-async-iterators/issues/67)) ([bfbb352](https://github.com/shtaif/react-async-iterators/commit/bfbb352c5fe42f298e830d75340f0e14b44ee373))
* **readme:** further content for `README.md` ([#65](https://github.com/shtaif/react-async-iterators/issues/65)) ([3a256e8](https://github.com/shtaif/react-async-iterators/commit/3a256e8f225f9ede95cad106816055e0b882f7dd))
* **readme:** more edits ([#66](https://github.com/shtaif/react-async-iterators/issues/66)) ([8a6fc81](https://github.com/shtaif/react-async-iterators/commit/8a6fc81399e7a15402fe01dc7d28759a90e38ca7))

## [0.7.1](https://github.com/shtaif/react-async-iterators/compare/v0.7.0...v0.7.1) (2025-01-23)


### Bug Fixes

* **iterateFormatted:** compute formatted current value on demand instead of eagerly as the underlying value might change at any later time ([#63](https://github.com/shtaif/react-async-iterators/issues/63)) ([c4174ee](https://github.com/shtaif/react-async-iterators/commit/c4174ee072052d6cf2546e4921aecf982d84b11c))


### Documentation

* fix mentions of the current value property from `.current.value` to `.value.current` ([#64](https://github.com/shtaif/react-async-iterators/issues/64)) ([f2e4fef](https://github.com/shtaif/react-async-iterators/commit/f2e4feff6d2fe60833a0444c844be8bbc40f5434))
* various docs touchups ([#62](https://github.com/shtaif/react-async-iterators/issues/62)) ([9ad4aeb](https://github.com/shtaif/react-async-iterators/commit/9ad4aeb4c9c73487276eceb76c8c114f0f6f4d84))

## [0.7.0](https://github.com/shtaif/react-async-iterators/compare/v0.6.0...v0.7.0) (2025-01-22)


### Features

* `iterateFormatted`'s to also format given iterables' current values if present ([#56](https://github.com/shtaif/react-async-iterators/issues/56)) ([9f6e47a](https://github.com/shtaif/react-async-iterators/commit/9f6e47ac3bc717eb3f72307893899e57398bd7d7))
* export a `AsyncIterableSubject` type and add it along related references ([#54](https://github.com/shtaif/react-async-iterators/issues/54)) ([39eae6f](https://github.com/shtaif/react-async-iterators/commit/39eae6fe7aa7f595cdb20f640be6de2264170212))
* **Iterate:** support initial value in function form ([#49](https://github.com/shtaif/react-async-iterators/issues/49)) ([bfc1f09](https://github.com/shtaif/react-async-iterators/commit/bfc1f09ba8b68b50dd62ceeb84833b8ccad7265e))
* special handling for async iterables with a current value( [#55](https://github.com/shtaif/react-async-iterators/issues/55)) ([01a30fc](https://github.com/shtaif/react-async-iterators/commit/01a30fce01eb5f0ebd2b9c712ace66efdc89a99b))
* **useAsyncIter:** allow initial value to be a function, called once on mount ([#48](https://github.com/shtaif/react-async-iterators/issues/48)) ([9a7e9e4](https://github.com/shtaif/react-async-iterators/commit/9a7e9e4ab66bccacefc7e47c4f82bee390d22e08))


### Bug Fixes

* **iterateFormatted:** function's type signature does not not handle maybe-async-iterable kind of types correctly ([#57](https://github.com/shtaif/react-async-iterators/issues/57)) ([f073d90](https://github.com/shtaif/react-async-iterators/commit/f073d905ba0e4fd3a1faa0b45204738c405837dc))


### Documentation

* docs edits ([#53](https://github.com/shtaif/react-async-iterators/issues/53)) ([c5bfba4](https://github.com/shtaif/react-async-iterators/commit/c5bfba42c923530ba8eed5b25a5024fa09563013))
* **readme:** Initial proper `README.md` ([#60](https://github.com/shtaif/react-async-iterators/issues/60)) ([4e1c4a9](https://github.com/shtaif/react-async-iterators/commit/4e1c4a97d9222c2600c946004d0e6f2e0d3a28d5))

## [0.6.0](https://github.com/shtaif/react-async-iterators/compare/v0.5.1...v0.6.0) (2025-01-09)


### Features

* **useAsyncIterState:** support for setting state with a function to calculate the new state from the previous ([#45](https://github.com/shtaif/react-async-iterators/issues/45)) ([392b2e9](https://github.com/shtaif/react-async-iterators/commit/392b2e908d8be96bb499aa13efa096d32cf9026f))
* **useAsyncIterState:** support setting an initial value via an argument ([#46](https://github.com/shtaif/react-async-iterators/issues/46)) ([08a664d](https://github.com/shtaif/react-async-iterators/commit/08a664df85cffe76b88601b6e49fb32f98166057))

## [0.5.1](https://github.com/shtaif/react-async-iterators/compare/v0.5.0...v0.5.1) (2025-01-08)


### Bug Fixes

* **useAsyncIterState:** disallow user manipulation of the state iterable's current value property ([#43](https://github.com/shtaif/react-async-iterators/issues/43)) ([6dd5ac5](https://github.com/shtaif/react-async-iterators/commit/6dd5ac5eb852da01e8178b332e0c083ca74bf091))
* **useAsyncIterState:** rapidly updating state yields the first update instead of the last update's value ([#44](https://github.com/shtaif/react-async-iterators/issues/44)) ([b11b5a5](https://github.com/shtaif/react-async-iterators/commit/b11b5a56c1ac3621b58a37fa04902b6bfd20da1a))


### Documentation

* **useAsyncIterState:** missing documentations for the state iterable's added current value property ([#42](https://github.com/shtaif/react-async-iterators/issues/42)) ([675331f](https://github.com/shtaif/react-async-iterators/commit/675331f444189124c55b19e21938f56d1d8343b7))

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
