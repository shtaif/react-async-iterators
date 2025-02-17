# React Async Iterators

> Hooks, components and utilities for working with JavaScript [async iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator) values in React.js.

<p>

  [![npm published version](https://img.shields.io/npm/v/react-async-iterators?logo=npm&color=cb3837
  )](https://www.npmjs.com/package/react-async-iterators)
  [![Tests status](https://github.com/shtaif/react-async-iterators/actions/workflows/ci-run-tests.yaml/badge.svg)](https://github.com/shtaif/react-async-iterators/actions/workflows/ci-run-tests.yaml)
  [![Build status](https://github.com/shtaif/react-async-iterators/actions/workflows/ci-ts-build-check.yaml/badge.svg)](https://github.com/shtaif/react-async-iterators/actions/workflows/ci-ts-build-check.yaml)
  [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://semver.org)
  [![MIT License](https://img.shields.io/npm/l/react-async-iterators?color=3178c6&style=flat-square)](https://github.com/shtaif/react-async-iterators/blob/master/LICENSE.txt)

</p>

A React.js library that makes it __easy and satisfying__ to integrate and render JS async iterators across and throughout your app's components. Expanding from that, it allows you to describe and propagate various aspects and states of your app in actual async iterator form, letting it tap into the full benefits and flexibility in this JS construct.



### Illustration:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/react-async-iterators-example-3?file=src%2FApp.tsx)

```tsx
import { It } from 'react-async-iterators';

const randoms = {
  async *[Symbol.asyncIterator]() {
    while (true) {
      await new Promise((r) => setTimeout(r, 500));
      const x = Math.random();
      yield Math.round(x * 10);
    }
  },
};

// and then:

<It>{randoms}</It>

// renders: '2'... '1'... '3'... etc.

// OR:

<It value={randoms}>
  {next => (
    next.pendingFirst
      ? '⏳ Loading first...'
      : <p>{next.value?.toExponential()}</p>
  )}
</It>

// renders:
//   '⏳ Loading first...'
//   <p>2e+0</p>...
//   <p>1e+0</p>...
//   <p>3e+0</p>...
//   etc.
```

Below is another interactive demo showing how to consume the `EventSource` web API (A.K.A [SSE](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)) converted into async iterable using the [`iterified`](https://github.com/shtaif/iterified) package:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/react-async-iterators-example-5?file=src%2FApp.tsx)



<!-- 
```tsx
const gqlWsClient = createGqlWsClient({ url: 'wss://my-api-backend/graphql' });

const subscription = gqlWsClient.iterate<PositionDataSubscriptionResult>({
  query: `...`,
});

// ...
```
-->

<!--
TODO: Include this example somewhere?
```tsx
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
```
-->



# Highlights

✔️ Fully written in TypeScript with comprehensive inferring typings<br />
✔️ Fully tree-shakeable exports<br />
✔️ Light weight, ZERO run-time dependencies<br />
✔️ ESM build<br />
✔️ [Semver](https://semver.org) compliant<br />



# Table of Contents

- [Introduction](#introduction)
  - [Who is react-async-iterators for?](#who-is-react-async-iterators-for)
  - [When should you use react-async-iterators?](#when-should-you-use-react-async-iterators)
  - [What can react-async-iterators do?](#what-can-react-async-iterators-do)
- [Installation](#installation)
- [Overview](#overview)
  - [Consuming async iterables](#consuming-async-iterables)
  - [Plain values](#plain-values)
  - [Iteration lifecycle](#iteration-lifecycle)
    - [Lifecycle phases](#lifecycle-phases)
  - [Async iterables with current values](#async-iterables-with-current-values)
  - [Formatting values](#formatting-values)
  - [State as an async iterable](#state-as-an-async-iterable)
- [API](#api)
  - [Iteration state properties breakdown](#iteration-state-properties-breakdown)
  - [Components](#components)
    - [`<It>`](#it)
    - [`<ItMulti>`](#itmulti)
  - [Hooks](#hooks)
    - [`useAsyncIter`](#useasynciter)
    - [`useAsyncIterMulti`](#useasyncitermulti)
    - [`useAsyncIterState`](#useasynciterstate)
    - [`useSharedAsyncIter`](#usesharedasynciter)
  - [Utils](#utils)
    - [`iterateFormatted`](#iterateformatted)
- [License](#license)



# Introduction

Async iterables and iterators are a native JavaScript construct that can be seen as a counterpart to [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)s in a way that is captured by the following:

> _A promise resolves __a single__ value asynchronously, whereas an async iterable is a stream yielding __any number__ of values asynchronously._

Slightly obvious to say, the React ecosystem is featuring many methods and tools that have to do with integration of promise-based data into your React components; from higher level SDK libraries, state managers - to generic async utilities, which make the different promise states accessible during render. And to the same extent, `react-async-iterators` packs hooks, components and utilities, written in 100% TypeScript, with the aim to make async iterables into __first-class citizens to React__ as they become gradually more prevalent across the JavaScript ecosystem.

<!-- TODO: Should mention here (or anywhere else?) about the state of the `async-iterator-helpers-proposal`, as well as existing possibilities to create and compose async iterables via `iter-tools` and `IxJS`? -->



## Who is `react-async-iterators` for?

`react-async-iterators` is designed for React developers aiming to seamlessly integrate asynchronous data streams into their apps, as well as enhance and optimize how they build their interactive data-driven apps in general. This library offers a declarative approach to manage real-time updates, push or pull based data sources, or any asynchronous series of values easily and effectively within React components.



## When should you use `react-async-iterators`?

- When integrating any async iterable obtained from a library, a web API, or composed manually.

- When apps involve any _asynchronously-generated series_ of data, such as data updated via recurring timers, WebSocket messages, GraphQL subscriptions, Geolocation watching and more...

- When rendering a complex form or dynamic widget with large nested component tree for which UI updates might impact UI performance.



## What can `react-async-iterators` do?

- Easily render any async iterable in a declarative, React-friendly style.
<!-- ...Dynamically plug and unplug them at any place across your app's component tree with automatic teardown... -->

- Convert any series of data into an async iterable, enabling it the full functionality of this library.

- Unlock new patterns for expressing data flow within and between components which greatly minimize redundant re-renders by embracing async iterables __as data__.

- Compose and refine your data in the form of async iterables, enabling specialized behaviors and optimizations in propagating your data which are otherwise very hard to achieve in a typical React environment.

- Build better apps and components by relying on async iterables' consistent semantics for completion and error, composability and resource encapsulation. Handle any async sequence of values perceivable via a single generic interface; ___the native one___, instead of grasping various methods and opinionated APIs coupled to every type of operation.



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



# Overview



## Consuming async iterables

Async iterables can be hooked into your components and consumed using [`<It>`](#it) and [`<ItMulti>`](#itmulti), or their hook counterparts [`useAsyncIter`](#useasynciter) and [`useAsyncIterMulti`](#useasyncitermulti) respectively.

The iteration values and states are expressed via a consistent structure (see exaustive list in [this breakdown](#iteration-state-object-detailed-breakdown)).<br/>
They may be accessed as follows:

```tsx
const myIter = getSomeIter(); // given some `myIter` async iterable
```

With [`<It>`](#it):

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

With [`useAsyncIter`](#useasynciter):

```tsx
import { useAsyncIter } from 'react-async-iterators';

const next = useAsyncIter(myIter, 'first_value');

// (Properties are identical to the above...)
next.pendingFirst;
next.value;
next.done;
next.error;
```

_Using the component form may be __typically preferrable__ over the hook form_ (e.g [`<It>`](#it) over [`useAsyncIter`](#useasynciter)) - Why? because using it, when changes in data occure - the re-rendered UI area within a component tree can be declaratively narrowed to the necessary minimum, saving other React elements that do not depend on its values from re-evaluation. On the the other hand - [`useAsyncIter`](#useasynciter), being a hook, must re-render the entirety of the host component's output for every new value.

When segregating different flows of data the components' render code like this, using the component forms - it makes for a more managable code, and might get rid of having to akwardly split components down to smaller parts just to render-optimize them when it otherwise wouldn't "feel right" to do so.



## Plain values

All of the consuming hooks and components __also__ accept plain (_"non-iterable"_) values safely, rendering them as-are with very low extra overhead - their inputs may alternate between async iterable and plain values any time.

When rendering a plain value, the iteration state properties behave alternatively like so:

- `.value` reflects the plain value as-is
- `.pendingFirst` and `.done` are ALWAYS `false`
- `.error` is ALWAYS empty

<br/>

> <br/>ℹ️ When providing a plain value right upon mounting - the initial value, if given, is ignored.<br/><br/>

<br/>

_Showing [`<It>`](#it) being used with either plain or async iterable values, wrapped as a custom component:_

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

Whenever the consumer receives a _new_ value to iterate, it will immediately dispose of any current running iteration (calling `.return()` on its held iterator) and proceed iterating the new value in the same manner described.

Finally, when the consumer is unmounted, any current running iteration is disposed of as well.

### Lifecycle phases

The following phases and state properties are reflected via all consumer utilities (with hooks - returned, with components - injected to their given render functions):

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
  <td colspan="3" align="center">
    ⬇️
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
  <td colspan="3" align="center">
    ⬇️
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
  <td colspan="3" align="center">

🔃 _Repeat on change of source value_ 🔃

  </td>
</tr>
</table>



## Async iterables with current values

Throughout the library there is a specially recognized case (or convention) for expressing async iterables with a notion of a _"current value"_. These are simply defined as any regular async iterable object coupled with a readable `.value.current` property.

When any consumer hook/component from the library detects the presence of a current value (`.value.current`) on an async iterable, it can render it immediately and skip the `isPending: true` [phase](#iteration-lifecycle-table-initial-phase), since it effectively signals there is no need to _wait_ for a first yield - the value is available already.

This rule bridges the gap between async iterables which always yield asynchronously (as their yields are wrapped in promises) and React's component model in which render outputs are strictly synchronous. Due to this discrepency, for example, if the first value for an async iterable is known in advance and yielded as soon as possible - React could only grab the yielded value from it via a subsequent (immediate) run/render of the consumer hook/component (since the promise can resolve only _after_ such initial sync run/render). This issue is therefore solved by async iterables that expose a current value.

For example, the stateful iterable created from the [`useAsyncIterState`](#useasynciterstate) hook (_see [State as an async iterable](#state-as-an-async-iterable)_) applies this convention from its design, acting like a "topic" with an always-available current value that's able to signal out future changes, skipping pending phases, so there's no need to set initial starting states.

<!-- TODO: Any code sample that can/should go in here?... -->



## Formatting values

<!-- TODO: ^^^ should add "and transforming iterables"? -->

When building your app with components accepting async iterable data as props, as you render these and have to provide such props - you may commonly see a need to _re-format_ held async iterables' value shapes before they're passed in those props, in order for them to match the expected shape. [`iterateFormatted`](#iterateformatted) is an easy-to-use approach to many cases like this.

For instance, let's say we're trying to use some existing `<Select>` generic component, which supports being given its option list __in async iterable form__, so it could update its rendered dropdown in real-time as new sets of options are yielded. It is used like so;

```tsx
<Select
  options={
    // EXPECTING HERE AN ASYNC ITER YIELDING:
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
// THIS YIELDS OBJECTS OF:
// {
//   isoCode: string;
//   name: string;
// }
```

As apparent, the value types between these two are not compatible (properties are not matching).

By using [`iterateFormatted`](#iterateformatted), our source iterable can be formatted/transformed to fit like so:

```tsx
const currenciesIter = getAvailableCurrenciesIter();

function MyComponent() {
  return (
    <div>
      <Select
        options={iterateFormatted(currenciesIter, ({ isoCode, name }) => ({
          value: isoCode,
          label: `${name} (${isoCode})`
        }))}
      />
    </div>
  );
}
```

Alternatively, such transformation can be also achieved (_entirely legitimately_) with help from [`React.useMemo`](https://react.dev/reference/react/useMemo) and some generic mapping operator like [`iter-tools`](https://github.com/iter-tools/iter-tools)'s `asyncMap`, among the breadth of operators available from such libraries:

```tsx
import { useMemo } from 'react';
import { execPipe as pipe, asyncMap } from 'iter-tools';

function MyComponent() {
  const formattedCurrenciesIter = useMemo(
    () =>
      pipe(
        getAvailableCurrenciesIter(),
        asyncMap(({ isoCode, name }) => ({
          value: isoCode,
          label: `${name} (${isoCode})`
        }))
      ),
    []
  );

  return (
    <div>
      <Select options={formattedCurrenciesIter} />
    </div>
  );
}
```

<br/>

> <br/>ℹ️ As seen above, unless you require some more elaborate transformation than simply formatting values - it might be more ergonomic to use [`iterateFormatted`](#iterateformatted) vs manual compositions within [`React.useMemo`](https://react.dev/reference/react/useMemo)s - especially if you're having to transform multiple iterables.<br/><br/>

Every call to [`iterateFormatted`](#iterateformatted) returns a _formatted_ versions of `currenciesIter` with some transparent metadata, which the library's consumers (like [`<It>`](#it)) use to associate every transformed iterable with its original source iterable, and this way existing iteration states can be persisted properly. It's therefore safe to recreate and pass on formatted iterables from repeated calls to [`iterateFormatted`](#iterateformatted) across re-renders (as long the same source is used with it consistently).



## State as an async iterable

<!-- TODO: Add a more comprehensive and elaborate code example of some kind of an interactive form? -->

As illustrated throughout this library and docs - when dealing with data in your app that's presented as an async iterable, an interesting pattern emerges; instead of a transition in app state traditionally sending down a cascading re-render through the entire tree of components underneath it to propagate the new state - your __async iterable__ objects can be distributed __once__ when the whole tree is first mounted, and new data is then communicated through them so it directly gets to the components that are concerned with displaying it, at the edges of the UI tree, re-rendering them exclusively and thus skipping all intermediaries.

The packaged [`useAsyncIterState`](#useasynciterstate) hook can lend this paradigm to your __component state__. It's like a [`React.useState`](https://react.dev/reference/react/useState) version that returns you _an async iterable of the state value instead of the state value_, paired with a setter function that causes the stateful iterable to yield the next states.

The stateful iterable may be distributed via props down through any number of component levels the same way you would with classic React state, and used in conjunction with [`<It>`](#it) or [`useAsyncIter`](#useasynciter), etc. wherever it has to be rendered.

In a glance, it's usage looks like this:

```tsx
import { useAsyncIterState, It } from 'react-async-iterators';

function MyCounter() {
  const [countIter, setCount] = useAsyncIterState(0);

  function handleIncrement() {
    setCount(count => count + 1);
  }

  return (
    <>
      Current count: <It>{countIter}</It> {/* <- this is the ONLY thing re-rendering here! */}
      <button onClick={handleIncrement}>Increment</button>
    </>
  );
}
```

The stateful iterable let's you access the current state any time via its `.value.current` property (see [Async iterables with current values](#async-iterables-with-current-values)) so you may read it when you need to get only the current state alone, for example - as part of some side effect logic;

```tsx
// Using the state iterable's `.value.current` property to read the immediate current state:

import { useAsyncIterState, It } from 'react-async-iterators';

function MyForm() {
  const [firstNameIter, setFirstName] = useAsyncIterState('');
  const [lastNameIter, setLastName] = useAsyncIterState('');

  return (
    <form
      onSubmit={() => {
        const firstName = firstNameIter.value.current;
        const lastName = lastNameIter.value.current;
        // submit `firstName` and `lastName`...
      }}
    >
      Greetings, <It>{firstNameIter}</It> <It>{lastNameIter}</It>

      {/* More content... */}
    </form>
  );
}
```

<br/>

> <br/>ℹ️ Remember that merely accessing `.value.current` will only get the current state at that point in time and is not meant for picking up future updates in it. To be in sync with current and future states, simply render the state iterable through a [`<It>`](#it).<br/><br/>

_Play with [`useAsyncIterState`](#useasynciterstate) inside a StackBlitz playground:_

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/react-async-iterators-example-4?file=src%2FApp.tsx)

<!-- TODO: Go over all mentions of [`<It>`](...), [`useAsyncIter`](...) and so on and make sure their links are are valid -->



# API



## Iteration state properties breakdown

The following iteration state properties are common for all consumer utilities, with hooks - returned, with components - injected to their given render functions.

As detailed below, the types of these properties are affected by particular phases of the iteration process - see [_Lifecycle phases_](#lifecycle-phases) for more info.

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
      Can be considered analogous to the promise <em>pending state</em>.<br/><br/>
      <i>** Is always <code>false</code> if source is a plain value instead of an async iterable.
    </td>
  </tr>
  <tr>
    <td>
      <code>.value</code>
    </td>
    <td>
      The most recent value yielded.<br/>
      If we've just started consuming the current iterable (while <code>pendingFirst</code> is <code>true</code>), the last value from a prior iterable would be carried over. If there is no prior iterable (the hook/component had just been mounted) - this will be set to the provided initial value (<code>undefined</code> by default).<br/><br/>
      <i>** If source is otherwise a plain value and not an async iterable - this will be itself.</i>
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
      When <code>true</code>, the adjacent <code>value</code> property will __still be set__ to the last value seen before the moment of completing/erroring.<br/><br/>
      <i>** Is always <code>false</code> if source is a plain value instead of an async iterable.</i>
    </td>
  </tr>
  <tr>
    <td>
      <code>.error</code>
    </td>
    <td>
      Indicates whether the iterated async iterable threw an error, capturing a reference to it.<br/>
      If <code>error</code> is non-empty, the escorting <code>done</code> property will always be <code>true</code> because the iteration process has effectively ended.<br/><br/>
      <i>** Is always <code>undefined</code> if source is a plain value instead of an async iterable.</i>
    </td>
  </tr>
</table>



## Components



### `<It>`

_Alias: [`<Iterate>`](#it)_

The [`<It>`](#it) component (also exported as [`<Iterate>`](#it)) is used to format and render an async iterable (or a plain non-iterable value) directly onto a piece of UI.

Essentially, can be seen as a [`useAsyncIter`](#useasynciter) hook in a component form.

```tsx
// In "simplified" form:

<It>{myIter}</It>


// In "render function" form:

<It value={myIter}>
  {({ value, pendingFirst, done, error }) =>
    // ...
  }
</It>
```

### Props

- `value`:
  The source value to iterate over - an async iterable or a plain (non async iterable) value. The input value may be changed any time, starting a new iteration in the background, per [Iteration lifecycle](#iteration-lifecycle). If using the "simplified" form, `value` is ignored and the source value should be provided as `children` instead.

- `initialValue`:
  An _optional_ starting value, defaults to `undefined`. Will be the value inserted into the child render function when [`<It>`](#it) first renders during mount and while it's pending first yield. You can pass an actual value, or a function that returns a value (which [`<It>`](#it) will call once during mounting).

- `children`:
  A render function that is called for each step of the iteration, returning something to render out of it, with the current state object as the argument (see [Iteration state properties breakdown](#iteration-state-properties-breakdown)). If using the "simplified" form instead - the source value should be directly passed as children and yielded values are rendered just as-are without any formatting on top.

### Notes

-
  Care should be taken to avoid passing a constantly recreated iterable object across re-renders, e.g; by declaring it outside the component body or by controlling __when__ it should be recreated with React's [`useMemo`](https://react.dev/reference/react/useMemo).

<details>
  <summary><b><i>Additional examples</i></b></summary>
  <br/>
  <ul>

  ```tsx
  import { It } from 'react-async-iterators';

  function SelfUpdatingTodoList(props) {
    return (
      <div>
        <h2>My TODOs</h2>

        <div>
          Last TODO was completed at: <It>{props.lastCompletedTodoDate}</It>
        </div>

        <ul>
          <It value={props.todosAsyncIter}>
            {({ value: todos }) =>
              todos?.map(todo =>
                <li key={todo.id}>{todo.text}</li>
              )
            }
          </It>
        </ul>
      </div>
    );
  }
  ```

  <br/>

  ```tsx
  // With the `initialValue` prop and showing usage of all properties of the iteration object
  // within the child render function:

  import { It } from 'react-async-iterators';

  function SelfUpdatingTodoList(props) {
    return (
      <div>
        <h2>My TODOs</h2>

        <It value={props.todosAsyncIter} initialValue={[]}>
          {todosNext =>
            todosNext.pendingFirst ? (
              <div>Loading first todos...</div>
            ) : (
              <>
                {todosNext.error ? (
                  <div>An error was encountered: {todosNext.error.toString()}</div>
                ) : (
                  todosNext.done && <div>No additional updates for todos are expected</div>
                )}

                <ul>
                  {todosNext.map(todo => (
                    <li key={todo.id}>{todo.text}</li>
                  ))}
                </ul>
              </>
            )
          }
        </It>
      </div>
    );
  }
  ```

  </ul>
</details>



### `<ItMulti>`

_Alias: [`<IterateMulti>`](#itmulti)_

The [`<ItMulti>`](#itmulti) component (also exported as [`<IterateMulti>`](#itmulti)) is used to combine and render any number of async iterables (or plain non-iterable values) directly onto a piece of UI.

It's similar to [`<It>`](#it), only it works with any changeable number of async iterables or plain values instead of a single one. Essentially, can be seen as a [`useAsyncIterMulti`](#useasyncitermulti) hook in a component form.

```tsx
<ItMulti values={[myIter, myOtherIter /* ... */]}>
  {([myIterNext, myOtherIterNext]) =>
    // ...
  }
</ItMulti>
```

### Props

- `values`:
  An array of values to iterate over simultaneously, which may include any mix of async iterables or plain (non async iterable) values. Source values may be added, removed or changed at any time and new iterations will be close and started accordingly as per [Iteration lifecycle](#iteration-lifecycle).

- `initialValues`:
  An _optional_ array of initial values or functions that return initial values. The values here will be the starting points for all the async iterables from `values` (by corresponding array positions) while they are rendered by the `children` render function __for the first time__ and for each while it is __pending its first yield__. Async iterables from `values` that have no initial value corresponding to them will assume `undefined` as initial value.

- `defaultInitialValue`:
  An _optional_ default starting value for every new async iterable in `values` if there is no corresponding one for it in the `initialValues` prop, defaults to `undefined`. You can pass an actual value, or a function that returns a value (which the hook will call for every new iterable added).

- `children`:
  A render function that is called on every progression in any of the running iterations, returning something to render for them. The function is called with an array of the combined iteration state objects of all sources currently given by the `values` prop (see [Iteration state properties breakdown](#iteration-state-properties-breakdown)).

### Notes

-
  Care should be taken to avoid passing constantly recreated async iterables across re-renders, e.g; by declaring iterables outside the component body or by controlling __when__ iterables should be recreated with React's [`useMemo`](https://react.dev/reference/react/useMemo).

<details>
  <summary><b><i>Additional examples</i></b></summary>
  <br/>
  <ul>

  ```tsx
  import { useMemo } from 'react';
  import { ItMulti } from 'react-async-iterators';

  function MyComponent() {
    const numberIter = useMemo(() => createNumberIter(), []);
    const arrayIter = useMemo(() => createArrayIter(), []);
    return (
      <>
        <Header />
        <SideMenu />
        <main>
          <ItMulti values={[numberIter, arrayIter]} initialValues={[0, []]}>
            {([numState, arrState]) => (
              <>
                <div>
                  {numState.pendingFirst
                    ? '⏳ Loading number...'
                    : `Current number: ${numState.value}`}
                </div>
                <div>
                  {arrState.pendingFirst
                    ? '⏳ Loading items...'
                    : arrState.value.map((item, i) => <div key={i}>{item}</div>)}
                </div>
              </>
            )}
          </ItMulti>
        </main>
      </>
    )
  }
  ```

  <br/>

  ```tsx
  // Using `<ItMulti>` with a dynamically changing amount of inputs:
  
  import { useState } from 'react';
  import { ItMulti, type MaybeAsyncIterable } from 'react-async-iterators';
  
  function DynamicInputsComponent() {
    const [inputs, setInputs] = useState<MaybeAsyncIterable<string>[]>([]);
  
    const addAsyncIterValue = () => {
      const iterableValue = (async function* () {
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          yield `Item ${i}`;
        }
      })();
      setInputs(prev => [iterableValue, ...prev]);
    };
  
    const addStaticValue = () => {
      const staticValue = `Static ${inputs.length + 1}`;
      setInputs(prev => [staticValue, ...prev]);
    };
  
    return (
      <div>
        <h3>Dynamic Concurrent Async Iteration</h3>
  
        <button onClick={addAsyncIterValue}>🔄 Add Async Iterable</button>
        <button onClick={addStaticValue}>🗿 Add Static Value</button>
  
        <ul>
          <ItMulti values={inputs} defaultInitialValue="">
            {states =>
              states.map((state, i) => (
                <li key={i}>
                  {state.done
                    ? state.error
                      ? `Error: ${state.error}`
                      : 'Done'
                    : state.pendingFirst
                      ? 'Pending...'
                      : `Value: ${state.value}`}
                </li>
              ))
            }
          </ItMulti>
        </ul>
      </div>
    );
  }
  ```

  </ul>

</details>



## Hooks



### `useAsyncIter`

[`useAsyncIter`](#useasynciter) hooks up a single async iterable value to your component and its lifecycle.

```tsx
const next = useAsyncIter(myIter, 'initial_value');

next.value;
next.pendingFirst;
next.done;
next.error;
```

### Parameters

- `value`:
  The source value to iterate over - an async iterable or a plain (non async iterable) value. The input value may be changed any time, starting a new iteration in the background, per [Iteration lifecycle](#iteration-lifecycle).

- `initialValue`:
  An _optional_ starting value for the hook to return prior to the ___first yield___ of the ___first given___ async iterable, defaults to `undefined`. You can pass an actual value, or a function that returns a value (which the hook will call once during mounting).

### Returns

  The iteration state object with properties reflecting the current state of the iterated async iterable or plain value provided via `value` (see [Iteration state properties breakdown](#iteration-state-properties-breakdown)).

### Notes

-
  [`<It>`](#it) may be preferable over the [`useAsyncIter`](#useasynciter) counterpart typically as the UI area it re-renders within a component tree can be confined expressively to the necessary minimum, saving any other unrelated elements from re-evaluation. On the other hand, [`useAsyncIter`](#useasynciter) being a hook must re-render the entire component's output for every new value.

-
  Care should be taken to avoid passing a constantly recreated iterable object across re-renders, e.g; by declaring it outside the component body or by controlling __when__ it should be recreated with React's [`useMemo`](https://react.dev/reference/react/useMemo).

<details>
  <summary><b><i>Additional examples</i></b></summary>
  <br/>
  <ul>

  ```tsx
  import { useAsyncIter } from 'react-async-iterators';

  function SelfUpdatingTodoList(props) {
    const { value: todos } = useAsyncIter(props.todosAsyncIter);
    return (
      <ul>
        {todos?.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    );
  }
  ```

  <br/>

  ```tsx
  // With an `initialVal` and showing usage of all properties of the returned iteration object:

  import { useAsyncIter } from 'react-async-iterators';

  function SelfUpdatingTodoList(props) {
    const todosNext = useAsyncIter(props.todosAsyncIter, []);

    return (
      <>
        {todosNext.error ? (
          <div>An error was encountered: {todosNext.error.toString()}</div>
        ) : todosNext.done && (
          <div>No additional updates for todos are expected</div>
        )}

        {todosNext.pendingFirst ? (
          <div>Loading first todos...</div>
        ) : (
          <ul>
            {todosNext.map(todo => (
              <li key={todo.id}>{todo.text}</li>
            ))}
          </ul>
        )}
      </>
    );
  }
  ```

  <ul>
</details>



### `useAsyncIterMulti`

[`useAsyncIterMulti`](#useasyncitermulti) hooks up multiple async iterable (or plain) values to your component and its lifecycle.

It's similar to [`useAsyncIter`](#useasynciter), only it works with any number of async iterables or plain values instead of a single one.

```tsx
const nextStates = useAsyncIterMulti(iters);

// or also:

const [nextNum, nextStr, nextArr] = useAsyncIterMulti([numberIter, stringIter, arrayIter], {
  initialValues: [0, '', []]
});
```

### Parameters

- `values`:
  An array of values to iterate over simultaneously, which may include any mix of async iterables or plain (non async iterable) values. Source values may be added, removed or changed at any time and new iterations will be close and started accordingly as per [Iteration lifecycle](#iteration-lifecycle).

- `opts`:
  An _optional_ object with properties:

  - `initialValues`:
    An _optional_ array of initial values or functions that return initial values. The values will be the starting points for all the async iterables from `values` (by corresponding array positions) __for the first time__ and for each while it is __pending its first yield__. For async iterables from `values` that have no corresponding item here the provided `opts.defaultInitialValue` will be used as fallback.

  - `defaultInitialValue`:
    An _optional_ default starting value for every new async iterable in `values` if there is no corresponding one for it in `opts.initialValues`, defaults to `undefined`. You can pass an actual value, or a function that returns a value (which the hook will call for every new iterable added).

### Returns

<ul>

  An array of objects with up-to-date information about each input's current value, completion status, and more - corresponding to the order by which they appear on `values` (see [Iteration state properties breakdown](#iteration-state-properties-breakdown)).

</ul>

### Notes

-
  Care should be taken to avoid passing constantly recreated async iterables across re-renders, e.g; by declaring iterables outside the component body or by controlling __when__ iterables should be recreated with React's [`useMemo`](https://react.dev/reference/react/useMemo).
  
<details>
  <summary><b><i>Additional examples</i></b></summary>
  <br/>
  <ul>

  ```tsx
  import { useAsyncIterMulti } from 'react-async-iterators';

  function MyDemo() {
    const [currentWords, currentFruits] = useAsyncIterMulti(
      [wordGen, fruitGen],
      { initialValues: ['', []] }
    );

    return (
      <div>
        Current word:
        <h2>
          {currentWords.pendingFirst
            ? 'Loading words...'
            : currentWords.error
            ? `Error: ${currentWords.error}`
            : currentWords.done
            ? `Done (last value: ${currentWords.value})`
            : `Value: ${currentWords.value}`}
        </h2>

        Fruits:
        <ul>
          {currentFruits.pendingFirst
            ? 'Loading fruits...'
            : currentFruits.value.map(fruit => (
              <li key={fruit.icon}>{fruit.icon}</li>
            ))}
        </ul>
      </div>
    );
  }

  const wordGen = (async function* () {
    const words = ['Hello', 'React', 'Async', 'Iterators'];
    for (const word of words) {
      await new Promise(resolve => setTimeout(resolve, 1250));
      yield word;
    }
  })();

  const fruitGen = (async function* () {
    const sets = [
      [{ icon: '🍑' }, { icon: '🥭' }, { icon: '🍊' }],
      [{ icon: '🍏' }, { icon: '🍐' }, { icon: '🍋' }],
      [{ icon: '🍉' }, { icon: '🥝' }, { icon: '🍇' }],
    ];
    for (const fruits of sets) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      yield fruits;
    }
  })();
  ```

  </ul>

  <br/>

  ```tsx
  // Using `useAsyncIterMulti` with a dynamically changing amount of inputs:

  import { useState } from 'react';
  import { useAsyncIterMulti, type MaybeAsyncIterable } from 'react-async-iterators';

  function DynamicInputsComponent() {
    const [inputs, setInputs] = useState<MaybeAsyncIterable<string>[]>([]);

    const states = useAsyncIterMulti(inputs, { defaultInitialValue: '' });

    const addAsyncIterValue = () => {
      const iterableValue = (async function* () {
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          yield `Item ${i}`;
        }
      })();
      setInputs(prev => [...prev, iterableValue]);
    };

    const addStaticValue = () => {
      const staticValue = `Static ${inputs.length + 1}`;
      setInputs(prev => [...prev, staticValue]);
    };

    return (
      <div>
        <h3>Dynamic Concurrent Async Iteration</h3>

        <button onClick={addAsyncIterValue}>🔄 Add Async Iterable</button>
        <button onClick={addStaticValue}>🗿 Add Static Value</button>

        <ul>
          {states.map((state, i) => (
            <li key={i}>
              {state.done
                ? state.error
                  ? `Error: ${state.error}`
                  : 'Done'
                : state.pendingFirst
                  ? 'Pending...'
                  : `Value: ${state.value}`}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  ```
</details>



### `useAsyncIterState`

Basically like [`React.useState`](https://react.dev/reference/react/useState), only that the value is provided back __wrapped in an async iterable__.

This hook allows a component to declare and manage a piece of state as an async iterable thus letting you easily control what specific places in the app UI tree should be bound to it, re-rendering in reaction to its changes (if used in conjunction with [`<It>`](#it) for example).

```tsx
const [valueIter, setValue] = useAsyncIterState(initialValue);

function handleChange() {
  setValue(valueIter.value.current + 1);
  // or:
  setValue(value => value + 1);
}

<It>{valueIter}</It>

function handleValueSubmit() {
  // use `valueIter.value.current` to get the current state immediately
  // (e.g, as part of some side effect logic)
  submitMyValue({ value: valueIter.value.current });
}
```

### Parameters

- `initialValue`:
  Any _optional_ starting value for the state iterable's `.value.current` property, defaults to `undefined`. You can pass an actual value, or a function that returns a value (which the hook will call once during mounting).

### Returns

<ul>

  A stateful async iterable with accessible current value and a function for yielding an update. The returned async iterable is a shared iterable such that multiple simultaneous consumers (e.g multiple [`<It>`](#it)s) all pick up the same yields at the same times. The setter function, like[`React.useState`'s setter](https://react.dev/reference/react/useState#setstate), can be provided either the next state directly, or a function that calculates it from the previous state.

</ul>

### Notes

<ul>

  > <br/>ℹ️ The returned state iterable also contains a `.value.current` property which shows the current up to date state value at any time. Use this any time you need to read the immediate current state (e.g as part of side effects). Otherwise, to display its value and future ones to a user simply render it with things like [`<It>`](#it)/[`<ItMulti>`](#itmulti), [`useAsyncIter`](#useasynciter), etc - more info at [Async iterables with current values](#async-iterables-with-current-values).<br/><br/>

  > <br/>ℹ️ The returned async iterable and setter function both maintain stable references across re-renders so are effective for use within React's [`useMemo`](https://react.dev/reference/react/useMemo) or [`useEffect`](https://react.dev/reference/react/useEffect) and their dependency lists.<br/><br/>

</ul>

<details>
  <summary><b><i>Additional examples</i></b></summary>
  <br/>
  <ul>

  ```tsx
  import { useAsyncIterState, It } from 'react-async-iterators';

  function MyForm() {
    const [firstNameIter, setFirstName] = useAsyncIterState('');
    const [lastNameIter, setLastName] = useAsyncIterState('');
    return (
      <div>
        <form>
          <FirstNameInput valueIter={firstNameIter} onChange={setFirstName} />
          <LastNameInput valueIter={lastNameIter} onChange={setLastName} />
        </form>

        Greetings, <It>{firstNameIter}</It> <It>{lastNameIter}</It>
      </div>
    );
  }
  ```

  <br/>

  ```tsx
  // Use the state iterable's `.value.current` property to read the immediate current state:

  import { useAsyncIterState } from 'react-async-iterators';

  function MyForm() {
    const [firstNameIter, setFirstName] = useAsyncIterState('');
    const [lastNameIter, setLastName] = useAsyncIterState('');

    return (
      <form
        onSubmit={() => {
          const firstName = firstNameIter.value.current;
          const lastName = lastNameIter.value.current;
          // submit `firstName` and `lastName`...
        }}
      >
        <>...</>
      </form>
    );
  }
  ```

  </ul>
</details>



### useSharedAsyncIter

Hook that takes a source async iterable and returns a version of it that will always initialize up to
just one single instance of the source at any point in time, sharing it to any number of simultaneous consumers
the result iterable might have (e.g multiple [`<It>`](#it)s).

```tsx
const sharedIter = useSharedAsyncIter(iter);
// ...
```

Any number of iterators for the resulting iterable you create and consume simultaneously will only ever
create a single iterator internally for the original source and distribute every yielded value, completion or
possible error among each of them.

In a _reference-counting_ fashion, only when the last remaining iterator is closed will the shared
source iterator be finally closed as well, disposing of resources it held, after which instantiating a new iterator will restart the cycle. This way, async iterables that instantiate server connections, streams, etc. - can easily be consumed or rendered concurrently by multiple components without possibly opening duplicate resources or other undesired effects, depending on the way these source iterables were constructed.

If given a plain non-iterable value, this hook would seamlessly return it as-is without additional effect.

### Parameters

- `value`:
  The source async iterable or plain value.

### Returns

<ul>

  A "_shared_" version of the source async iterable or the source value itself in case it was a plain value.

</ul>

### Notes

<ul>

  > <br/>ℹ️ Repeated calls with the same source iterable will return the same memoized result iterable, as well as calls with [`iterateFormatted`](#iterateformatted)-returned iterables based of the same source for that matter.<br/><br/>

</ul>

<details>
  <summary><b><i>Additional examples</i></b></summary>
  <br/>
  <ul>

  ```tsx
  import { useSharedAsyncIter, It } from 'react-async-iterators';

  function MyComponent(props) {
    const messagesIter = useSharedAsyncIter(props.messagesIter);

    return (
      <div>
        Number of unread messages:
        <It value={messagesIter}>
          {next => (
            next.value?.filter(msg => msg.isRead).length ?? 0
          )}
        </It>

        Message list:
        <It value={messagesIter}>
          {next => (
            next.value?.map(msg => (
              <div>
                From: {msg.from},
                Date: {msg.date},
                Was read: {msg.isRead ? 'Y' : 'N'}
              </div>
            ))
          )}
        </It>
      </div>
    );
  }
  ```

  </ul>
</details>



## Utils



### `iterateFormatted`

A utility to inline-format an async iterable's values before passed into another consuming component.

Can be thought of as mapping an async iterable before being rendered/passed over in the same way you would commonly `.map(...)` an array before rendering/passing it over. More details in [Formatting values](#formatting-values).

```tsx
iterateFormatted(myIter, (value, idx) => {
  // return a formatted value here...
})
```

```tsx
// With some given async-iter-receiving `<Select>` component:

<Select
  optionsIter={iterateFormatted(currenciesIter, ({ isoCode, name }) => ({
    value: isoCode,
    label: `${name} (${isoCode})`
  }))}
  onChange={...}
/>
```

### Parameters

- `source`:
  Any async iterable or plain value.

- `formatFn`:
  Function that performs formatting/mapping logic for each value of `source`. It is called with current value and the iteration index as arguments.

### Returns

  A transformed async iterable emitting every value of `source` after formatting. If `source` is a plain value and not an async iterable, it will be passed into the given `formatFn` and returned on the spot.

### Notes

  - [`iterateFormatted`](#iterateformatted) acts by returning a new transformed version of the source async iterable object, attaching it with some special metadata telling consumers like [`<It>`](#it) and [`useAsyncIter`](#useasynciter) that the original base object is what the iteration process should be bound to instead of the given object. This way, the resulting formatted iterable may be recreated repeatedly without concerns of restarting the iteration process (as long as `source` is passed the same base iterable consistently).

  - If `source` has a current value property at `.value.current` (see [Async iterables with current values](#async-iterables-with-current-values)), it will be formatted via `formatFn` as well.

  - If `source` is a plain value and not an async iterable, it will be passed into the given `formatFn` and returned on the spot.

<details>
  <summary><b><i>Additional examples</i></b></summary>
  <br/>
  <ul>

  ```tsx
  import { iterateFormatted } from 'iter-tools';

  const currenciesIter = getAvailableCurrenciesIter();

  // This:

  function MyComponent() {
    return (
      <div>
        <Select
          options={iterateFormatted(currenciesIter, ({ isoCode, name }) => ({
            value: isoCode,
            label: `${name} (${isoCode})`
          }))}
        />
      </div>
    );
  }
  
  // instead of this:
  
  import { useMemo } from 'react';
  import { execPipe as pipe, asyncMap } from 'iter-tools';

  function MyComponent() {
    const formattedCurrenciesIter = useMemo(
      () =>
        pipe(
          currenciesIter,
          asyncMap(({ isoCode, name }) => ({
            value: isoCode,
            label: `${name} (${isoCode})`
          }))
        ),
      []
    );

    return (
      <div>
        <Select options={formattedCurrenciesIter} />
      </div>
    );
  }
  ```

  </ul>
</details>

<br/>



# License

Free and licensed under the [MIT License](https://github.com/shtaif/react-async-iterators/blob/master/LICENSE.txt) (c) 2024
