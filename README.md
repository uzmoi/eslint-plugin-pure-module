# eslint-plugin-pure-module

An ESLint plugin that adds rules to disallow side effects at the top level of modules.

## Config

in `eslint.config.js`:

```js
import pureModule from "eslint-plugin-pure-module";

export default [
  {
    plugins: {
      "pure-module": pureModule,
    },
    rules: {
      "pure-module/pure-module": "error",
    },
  },
];
```

## Example

### Incorrect

```ts
foo();
bar``;
await promise;
obj.prop = "side effect";
delete obj.prop;
throw error;
```

### Correct

```ts
new Foo();
/* #__PURE__ */ foo();

const fn = async () => {
  await fetch("https://example.com");
  obj.prop = "side effect";
  delete obj.prop;
  throw error;
};
```

## Options

```ts
interface PureModuleRuleOptions {
  /** @default [] */
  pureFunctions?: string[];
  /** @default false */
  allowCall?: boolean;
  /** @default allowCall */
  allowTaggedTemplate?: boolean;
  /** @default true */
  allowNew?: boolean;
  /** @default false */
  allowAssign?: boolean;
  /** @default false */
  allowDelete?: boolean;
  /** @default false */
  allowThrow?: boolean;
  /** @default false */
  allowAwait?: boolean;
  /** @default true */
  allowInClassStatic?: boolean;
}
```
