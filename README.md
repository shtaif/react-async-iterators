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

Async iterables/iterators are a native language construct in JS that can be viewed as a counterpart to [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), in the sense that while a promise asynchronously resolves one value - an async iterable is a stream that asynchronously yields any number of values.

Somewhat obvious to say, the React ecosystem features many methods and tools that have to do with integrating promise-based data into your React components; from higher level SDK libraries, state managers - to generic async utilities, which make the different promise states available to the rendering. And just like that - `react-async-iterators` packs hooks, components and utilities written in TypeScript with the aim to make async iterables into __first-class citizens to React__ as they become gradually more prevalent across the JavaScript platform.

What can `react-async-iterators` be used for?

- easily consuming async iterables obtained from any library, web API or composed manually - in a declarative React-friendly fashion.
<!-- Dynamically plug and unplug them at any place across your app's component tree with automatic teardown. -->

- unlock new ways of expressing efficient data flow in or between components, constricting redundant re-rendering.
<!-- made possible by the async iterables' unique properties (more on that later). -->

<!-- TODO: Should mention here (or anywhere else?) about the state of the `async-iterator-helpers-proposal`, as well as existing possibilities to create and compose async iterables via `iter-tools` and `IxJS`? -->

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

<!-- TODO: Include this example somewhere? -->
<!-- ```tsx
import { useMemo } from 'react';
import { useAsyncIter } from 'react-async-iterators';

function LiveUserProfile(props: { userId: string }) {
  const profileIter = useMemo(
    () => subscribeToUserProfile(props.userId),
    [props.userId]
  );

  const { pendingFirst, value: profile } = useAsyncIter(profileIter);

  return (
    <div>
      {pendingFirst ? (
        'Loading profile...'
      ) : (
        <>
          <div>First name: {profile.firstName}</div>
          <div>Last name: {profile.lastName}</div>
        </>
      )}
    </div>
  );
}
``` -->



# Highlights

✔️ Fully written in TypeScript with comprehensive inferring typings<br />
✔️ Fully tree-shakeable exports<br />
✔️ Light weight, zero run-time dependencies<br />
✔️ ESM build<br />
✔️ [Semver](https://semver.org) compliant<br />



# Table of Contents

- [Installation](#installation)
- [Walkthrough](#walkthrough)
  - [Consuming async iterables](#consuming-async-iterables)
  - [Plain values](#plain-values)
  - [Iteration lifecycle](#iteration-lifecycle)
  - [Async iterables with current values](#async-iterables-with-current-values)
  - [Formatting values](#formatting-values)
  - [Component state as an async iterable](#component-state-as-an-async-iterable)
- [API](#api)
  - [Iteration state object detailed breakdown](#iteration-state-object-detailed-breakdown)
  - [___](#___)
  - [___](#___)
- [License](#license)



# Installation

<!-- TODO: Should make this into 3 collapsible sections, one for each per package manager? -->

```sh
# With npm:
npm i react-async-iterators

# With pnpm:
pnpm i react-async-iterators

# With Yarn:
yarn add react-async-iterators
```

Can then be imported as follows (TypeScript/ESM style):

```ts
import { It, type IterationResult } from 'react-async-iterators';
```



# Walkthrough



## Consuming async iterables

Async iterables can be hooked into your components and consumed using [`<It>`]() and [`<ItMulti>`](), or their hook version counterparts [`useAsyncIter`]() and [`useAsyncIterMulti`]() respectively.

The iteration values and states are expressed via a consistent structure (more exaustive list in [this breakdown](#iteration-state-object-detailed-breakdown)).<br/>
They may be accessed as follows:

```tsx
const myIter = getSomeIter(); // given some `myIter` async iterable
```

With [`<It>`]():

```tsx
import { It } from 'react-async-iterators';

<It value={myIter} initialValue="first_value">
  {next => {
    next.pendingFirst; /* -> whether we're still waiting for the first value yielded
                             from `myIter`, analogous to a promise's pending state. */

    next.value; /* -> the most recent value yielded. If `pendingFirst` is `true`,
                      we should see the last value carried over from the previous
                      iterable before `myIter` (otherwise fall back to "first_value"
                      if we've just been mounted) */

    next.done; /* -> whether the iteration of `myIter` has finished (will yield no
                     further values) */
    
    next.error; /* -> if the iterated async iterable threw an error, this will be set
                      to it along with `done` showing `true` */
  }}
</It>
```

With [`useAsyncIter`]():

```tsx
import { useAsyncIter } from 'react-async-iterators';

const next = useAsyncIter(myIter, 'first_value');

// (Properties are identical to the above...)
next.pendingFirst;
next.value;
next.done;
next.error;
```

_Using the component form may be __typically preferrable__ over the hook form_ (e.g [`<It>`]() over [`useAsyncIter`]()) - Why? because using it, when changes in data occure - the re-rendered UI area within a component tree can be declaratively narrowed to the necessary minimum, saving other React elements that do not depend on its values from re-evaluation. On the the other hand - [`useAsyncIter`](), being a hook, must re-render the entirety of the host component's output for every new value.

When segregating data flows and relationships across the components' render code like this, using the component forms - it makes for a more managable code, and might get rid of having to akwardly split components down to smaller parts just to render-optimize them when it otherwise wouldn't feel right to do so.



## Plain values

All of the consuming hooks and components __also__ accept plain (_"non-iterable"_) values safely, rendering them as-are with very low extra overhead - their inputs may alternate between async iterable and plain values at any time.

When rendering a plain value, the iteration state properties behave alternatively like so:

- `.value` reflects the plain value as-is
- `.pendingFirst` and `.done` are ALWAYS `false`
- `.error` is ALWAYS empty

<br/>

> <br/>ℹ️ When providing a plain value right upon mounting - the initial value, if given, is ignored.<br/><br/>

<br/>

_Showing [`<It>`]() being used with either plain or async iterable values, wrapped as a custom component:_

```tsx
import { It, type MaybeAsyncIterable } from 'react-async-iterators';

function Foo(props: {
  value: MaybeAsyncIterable<string>;
}) {
  return (
    <It value={props.value}>
      {next => (
        /* ... */
      )}
    </It>
  );
}

// Later:

<Foo value="my_value" />
// or:
<Foo value={myStringIter} />
```

<br/>

> <br/>⬆️ Note use of the `MaybeAsyncIterable` convenience type<br/><br/>

<br/>

One use for this among others is an ability for a certain async-iterable-fed UI piece to be pushed some alternative "placeholder" value at times there isn't an actual async iterable available to feed it with.

Another implication of this conveniency is the possibility to design apps and component libraries that can receive data expressable in both _"static"_ and _"changing"_ fashions - seamlessly. If a certain component has to be given a string value prop, but you happen to (or wish to) only have an ___async iterable of strings___ at hand - why shouldn't you be able to ___pass just that___ onto the same prop and it would just work as expected - self updating whenever the next string is yielded? Async iterables are standard JavaScript after all.

<!-- TODO: Make some code example for an app with static/changing data bybrid components and link to it from here? -->



## Iteration lifecycle

When rendering an async iterable with any of the consuming component/hooks, they immediately begin iterating through it value-by-value.

The current active iteration is always associated to the particular value that was given into the consumer component or hook, such that re-rendering the consumer again and again with a reference to the same object will keep the same active iteration running persistingly in a React-like fashion (similar to [`React.useEffect`](https://react.dev/reference/react/useEffect) not re-running until its dependencies are changed).

Whenever the consumer receives a _new_ value to iterate, it will immediately dispose of the current running iteration (calling `.return()` on its held iterator) and proceed iterating the new value in the same manner as before.

Finally, when the consumer is unmounted, the current running iteration is disposed of as well.

### Iteration lifecycle phases

The following phases and state properties are reflected from all consumer utilities (with hooks - returned, with components - injected to their provided render functions):

<table>
<tr>
  <th>
    Phase
  </th>
  <th>
    Description
  </th>
</tr>
<tr>
  <td>

<span id="iteration-lifecycle-table-initial-phase">1. ___Initial phase;___</span>

  </td>
  <td>

a single occurrence of:

```ts
{
  pendingFirst: true,
  value: INITIAL_VALUE,
  done: false,
  error: undefined
}
```

...if input is an async iterable with no [_current value_](#async-iterables-with-current-values) - <br/>Otherwise, phase is skipped.

  </td>
</tr>
<tr>
  <td>

<span>2. ___Yields phase;___</span>

  </td>
  <td>

...zero or more rounds of:

```ts
{
  pendingFirst: false,
  value: VALUE,
  done: false,
  error: undefined
},
// ...
// ...
```

  </td>
</tr>
<tr>
  <td>

<span>3. ___Ending phase;___</span>

  </td>
  <td>

```ts
{
  pendingFirst: false,
  value: PREVIOUS_RECENT_VALUE,
  done: true,
  error: POSSIBLE_ERROR
}
```

with `error` property being non-empty - __ending due to source throwing an error__</br>
or<br/>
with `error` property being `undefined` - __ending due to completion - source is done__.

  </td>
</tr>
<tr>
  <td>

<span>___Repeat when changing to new source value___ 🔃</span>

  </td>
  <td>
    ***
  </td>
</tr>
</table>



## Async iterables with current values

Throughout the library there is a specially recognized case (or convention) for expressing async iterables with a notion of a _"current value"_. These are simply defined as any regular async iterable object coupled with a readable `.value.current` property.

If a any consumer hook/component from the library detects the presence of a current value (`.value.current`), it can render it immediately and skip the `isPending: true` [phase](#iteration-lifecycle-table-initial-phase), since this effectively signals there is no need to _wait_ for a first yield - the value is available already.

This rule bridges the gap between async iterables which always yield asynchronously (as their yields are wrapped in promises) and React's component model in which render outputs should be strictly synchronous. Even if, for example, the first value for an async iterable is known in advance and is yielded as soon as possible - React could only grab the yielded value from it via an immediate subsequent run of the consumer hook/component (since the promise would always resolve _after_ the initial run). Such concern therefore may be solved with async iterables that expose a current value.

For example, the stateful iterable created from the [`useAsyncIterState`]() hook (_see [Component state as an async iterable](#component-state-as-an-async-iterable)_) applies this convention by intention, acting like a "topic" with an always-available current value that's able to signal future changes, skipping pending phases so there is no need to set and handle any initial starting state.

<!-- TODO: Any code sample that can/should go in here?... -->



## Formatting values

When building your app with components accepting async iterable data as props, and as you render these and have to provide them such props, a common need emerges to re-format held async iterables' value shapes before they could match the values asked by such props. [`iterateFormatted`]() is an easy to use utility for many such cases.

For instance, let's say we're trying to use an existing `<Select>` generic component, which supports getting its option list __in async iterable form__, so it could update its rendered dropdown in real-time as new sets of options are yielded. It is used like so;

```tsx
<Select
  options={
    // expecting here an async iter yielding:
    // {
    //   value: string;
    //   label: string;
    // }
  }
/>
```

Now, we would like to populate `<Select>`'s dropdown with some currency options from an async iterable like this one:

```tsx
const currenciesIter = getAvailableCurrenciesIter();
// This yields objects of:
// {
//   isoCode: string;
//   name: string;
// }
```

As seen, the yielded types between these two don't match (properties are not matching).

Using [`iterateFormatted`]() our source iterable can be formatted/transformed to fit like so:

```tsx
const currenciesIter = getAvailableCurrenciesIter();

function MyComponent() {
  return (
    <div>
      <Select
        options={iterateFormatted(currenciesIter, ({ isoCode, name }) => ({
          value: isoCode,
          label: name,
        }))}
      />
      // ...
    </div>
  );
}
```

Alternatively, such transformation can be also achieved like so, with help from [`React.useMemo`](https://react.dev/reference/react/useMemo) and the multitude of existing helpers from libraries like [`iter-tools`](https://github.com/iter-tools/iter-tools):

```tsx
import { useMemo } from 'react';
import { execPipe, asyncMap } from 'iter-tools';

function MyComponent() {
  const formattedCurrenciesIter = useMemo(
    () =>
      execPipe(
        getAvailableCurrenciesIter(),
        asyncMap(({ isoCode, name }) => ({
          value: isoCode,
          label: name,
        }))
      ),
    []
  );

  return (
    <div>
      <Select options={formattedCurrenciesIter} />
      // ...
    </div>
  );
}
```

But in cases with multiple...

<br/>
<br/>
<br/>
<br/>
<br/>
<br/>

```tsx
const currenciesIter = getAvailableCurrenciesIter();

function MyComponent() {
  currenciesIter;
  // ^ here we got an async iter yielding:
  // {
  //   isoCode: string;
  //   name: string;
  // }

  return (
    <div>
      <Select
        options={
          // BUT we here need an async iter yielding:
          // {
          //   value: string;
          //   label: string;
          // }
        }
      />
    </div>
  );

  // assume `<Select>` supports getting `options` in async iter form, thus it can update its dropdown when in real-time as updated currencies are yielded.
}
```

When you build app components with props accepting async iterable data, you'll probably find yourself needing to re-format values of source iterables so they match the types and shapes expected by those said app components, as they're probably decoupled to any particular source iterables' shapes you have. For this need and more, `react-async-iterators` packages a utility called [`iterateFormatted`]().

```tsx
function CountrySelect(
  props: AsyncIterable<{ value: string; label: string }>
) {
  
}
```

`react-async-iterators` offers a way to format 

```tsx
function MyComponent(props) {
  const { currencies, products } = props;

  return (
    <div>
      <SelectDropdown
        options={currencies.map(({ isoCode, name }) => ({
          value: isoCode,
          label: name,
        }))}
      />
      <ProductList
        products={products.map(({ id, name, price }) => ({
          sku: id,
          name,
          price,
        }))}
      />
    <div>
  );
}
```

```tsx
// `useMemo` with some pseudo third-party mapping helper `mapAsyncIter`:

function MyComponent(props) {
  const { currencies, products } = props; // `currencies` and `products` are async iterables

  const currenciesFormatted = useMemo(
    () =>
      mapAsyncIter(currencies, ({ isoCode, name }) => ({
        value: isoCode,
        label: name,
      })),
    [currencies]
  );

  const productsFormatted = useMemo(
    () =>
      mapAsyncIter(products, ({ id, name, price }) => ({
        sku: id,
        name,
        price,
      })),
    [products]
  );

  return (
    <div>
      <SelectDropdown options={currenciesFormatted} />
      <ProductList products={productsFormatted} />
    <div>
  );
}
```

```tsx
function MyComponent(props) {
  const { currencies, products } = props; // `currencies` and `products` are async iterables

  return (
    <div>
      <SelectDropdown
        options={iterateFormatted(currencies, ({ isoCode, name }) => ({
          value: isoCode,
          label: name,
        }))}
      />
      <ProductList
        products={iterateFormatted(products, ({ id, name, price }) => ({
          sku: id,
          name,
          price,
        }))}
      />
    <div>
  );
}
```



## Component state as an async iterable

...

```tsx
```



# API

...



## Iteration state object detailed breakdown:

<table>
  <thead>
    <tr>
      <th>Property</th>
      <th>Description</th>
    </tr>
  </thead>
  <tr>
    <td>
      <code>.pendingFirst</code>
    </td>
    <td>
      Boolean indicating whether we're still waiting for the first value to yield.<br/>
      Can be considered analogous to the promise <em>pending state</em>.
      <!-- TODO: If source is a plain ("non-iterable") value, this will always be <code>false</code> -->
    </td>
  </tr>
  <tr>
    <td>
      <code>.value</code>
    </td>
    <td>
      The most recent value yielded.<br/>
      If we've just started consuming the current iterable (while <code>pendingFirst</code> is <code>true</code>), the last value from a prior iterable would be carried over. If there is no prior iterable - the hook/component has just been mounted - this will be set as the provided initial value (<code>undefined</code> by default).<br/>
      If source is a plain value, this will be itself.
    </td>
  </tr>
  <tr>
    <td>
      <code>.done</code>
    </td>
    <td>
      Boolean indicating whether the async iterable's iteration has ended, having no further values to yield.<br/>
      This means either of:
      <ol>
        <li>it has completed (by resolving a <code>{ done: true }</code> object, per <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#done">async iteration protocol</a>)</li>
        <li>it had thrown an error (in which case the escorting <code>error</code> property will be set to that error).</li>
      </ol>
      When <code>true</code>, the adjacent <code>value</code> property will __still be set__ to the last value seen before the moment of completing/erroring.<br/>
      Is always <code>false</code> for any plain value given instead of an async iterable.
    </td>
  </tr>
  <tr>
    <td>
      <code>.error</code>
    </td>
    <td>
      Indicates whether the iterated async iterable threw an error, capturing a reference to it.<br/>
      If <code>error</code> is non-empty, the escorting <code>done</code> property will always be <code>true</code> because the iteration process has effectively ended.<br/>
      Is always <code>undefined</code> for any plain value given instead of an async iterable.
    </td>
  </tr>
</table>



# License

Free and licensed under the [MIT License](https://github.com/shtaif/react-async-iterators/blob/master/LICENSE.txt) (c) 2024
