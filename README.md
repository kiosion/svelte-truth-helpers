# svelte-truth-helpers

Common truth statement syntax for Svelte - {#unless}, {#eq}, {#or}, and {#gt} / {#lt}

## Why?

Svelte's built-in `{#if}` statement is great, but sometimes you need to check for more than simple truthiness. This plugin adds the following shortcut statements:
- `{#unless}` - the opposite of `{#if}`
- `{#eq}` - check for equality between two values, objects, arrays, or statements
- `{#or}` - check for truthiness of two or more values, objects, arrays, or statements
- `{#gt}` - check if a value is greater than another value
- `{#gte}` - check if a value is greater than or equal to another value
- `{#lt}` - check if a value is less than another value
- `{#lte}` - check if a value is less than or equal to another value

Although you _can_ achieve the same results with only `{#if}`, the syntax can get a bit difficult to read. For example, if you want to check if an expression is falsey, you would write:

```html
{#if !(expression())}
  <p>Expression is falsey</p>
{/if}
```

With this plugin, you can write:

```html
{#unless expression()}
  <p>Expression is falsey</p>
{/gt}
```

Not necessarily a huge difference, but it can make your code a bit more readable and easier-to-write when dealing with more complex cases.

## Installation

> **Note**
> Since this plugin isn't yet published, you can either install directly from GitHub via a `git://` URL in your `package.json`, or clone the repo and use `yarn link` to use locally.

## Usage

Add the preprocesser plugin to your `svelte.config.js`:

```js
import truthHelpers from 'svelte-truth-helpers';

const config = {
  preprocess: [
    truthHelpers()
  ];
};

export default config;
```

Use the statements in your code:

```html
{#unless foo}
  <p>Foo is falsey</p>
{/unless}

{#gt meaningOfLife, 41}
  <p>Meaning of life is greater than 41</p>
{/gt}

{#eq foo, bar}
  <p>Foo and bar are equal</p>
{/eq}

{#or foo, bar, baz}
  <p>One of foo, bar, or baz is truthy</p>
{/or}
```

## Todo

This plugin is currently a proof-of-concept and needs much more work before being considered stable. Here's a shortlist of things that need to be done:

- [ ] Fix uncaught `Cannot split a chunk...` error when transforming `{:else}` children blocks
- [ ] Add ESLint & prettier plugins so syntax can be seen as valid in IDEs
- [ ] Flush out example app
- [ ] Add tests

## Credits

This plugin is heavily based on [svelte-switch-case](https://github.com/l-portet/svelte-switch-case), which is an awesome plugin for bringing switch/case statements to Svelte. I highly recommend checking it out!
