# React Async Iterators

> Hooks, components and utilities for working with JavaScript [async iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator) values in React.js.

<br />

<p>
  <a href="https://www.npmjs.com/package/react-async-iterators">
    <img alt="npm published version" src="https://img.shields.io/npm/v/react-async-iterators.svg?logo=npm" />
  </a>
  <a href="https://github.com/shtaif/react-async-iterators/actions/workflows/ci-tests.yaml">
    <img alt="" src="https://github.com/shtaif/react-async-iterators/actions/workflows/ci-tests.yaml/badge.svg" />
  </a>
  <a href="https://github.com/shtaif/react-async-iterators/actions/workflows/ci-build-check.yaml">
    <img alt="" src="https://github.com/shtaif/react-async-iterators/actions/workflows/ci-build-check.yaml/badge.svg" />
  </a>
  <a href="https://semver.org">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg" />
  </a>
<p>

Async iterables/iterators are a native language construct in JS that can be viewed as a counterpart to [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), in the sense that while a promise asynchronously resolves one value - an async iterable on the other hand is a stream that asynchronously yields any number of values.

Somewhat obvious to say, the React ecosystem features many methods and tools that have to do with integrating promise-based data into your React components; from higher level SDK libraries, state managers - to generic async utilities, which make the different promise states available to the rendering. And just like that - `react-async-iterators` packs hooks, components and utilities written in TypeScript with the aim to make async iterables first-class citizens to React as they gradually become more prevalent across JS platforms.

What can `react-async-iterators` be used for?

- easily consuming async iterables obtained from any library, web API or composed manually. Dynamically plug and unplug them anywhere across your app's component tree with automatic teardown.
- unlock efficient new ways to express data flow in and between components and constrict unnecessary re-rendering by made possible by the unique properties of async iterables (more on that later).

### Illustration:

```tsx
import { It } from 'react-async-iterators';

const randoms = (async function* () {
  while (true) {
    await new Promise(r => setTimeout(r, 1000));
    const x = Math.random();
    yield Math.round(x * 10);
  }
})();

// and then:

<It>{randoms}</It>

// renders: '2'... '1'... '3'... etc.

// OR:

<It value={randoms}>
  {next => (
    next.pendingFirst
      ? 'Loading first...'
      : <p>{next.value.toExponential()}</p>
  )}
</It>

// renders:
//   'Loading first...'
//   <p>2e+0</p>...
//   <p>1e+0</p>...
//   <p>3e+0</p>...
//   etc.
```

# Highlights

✔️ Fully written in TypeScript with comprehensive inferring typings<br />
✔️ Fully tree-shakeable exports<br />
✔️ Light weight, zero run-time dependencies<br />
✔️ ESM build<br />
✔️ [Semver](https://semver.org) compliant<br />


# Table of Contents

- []
- []

## License

[MIT License](https://github.com/shtaif/react-async-iterators/blob/master/LICENSE.txt)
