import { RuleTester } from "@typescript-eslint/rule-tester";
import { name, rule } from "./pure-module";

const ruleTester = new RuleTester();

ruleTester.run(name, rule, {
	valid: [
		"const x = 42;",
		"const f = () => sideEffect();",
		"function f() { sideEffect() }",
		"const o = { f() { sideEffect() } };",
		"class Hoge { method() { sideEffect(); } }",
		"class Hoge { property = sideEffect(); }",
		"class Hoge { static { init(); } }",
		"/* #__PURE__ */ f();",
		"new Hoge;",
		{ code: "pure();", options: [{ pureFunctions: ["pure"] }] },
		{ code: "x.y.pure();", options: [{ pureFunctions: ["*.pure"] }] },
		{ code: "x.f();", options: [{ pureFunctions: ["x.*"] }] },
		{
			code: "import.meta.pure();",
			options: [{ pureFunctions: ["import.meta.pure"] }],
		},
		{
			code: "obj.import.meta.pure();",
			options: [{ pureFunctions: ["obj.import.meta.pure"] }],
		},
	],
	invalid: [
		{
			code: "f();",
			errors: [{ suggestions: [{ output: "/* #__PURE__ */ f();" }] }],
		},
		{
			code: "f``;",
			errors: [{ suggestions: [{ output: "/* #__PURE__ */ f``;" }] }],
		},
		{
			code: "new Hoge;",
			errors: [{ suggestions: [{ output: "/* #__PURE__ */ new Hoge;" }] }],
			options: [{ allowNew: false }],
		},
		{ code: "delete object.property;", errors: [{ suggestions: [] }] },
		{ code: "i++;", errors: [{ suggestions: [] }] },
		{ code: "i = 1;", errors: [{ suggestions: [] }] },
		{ code: "throw error;", errors: [{ suggestions: [] }] },
		{ code: "await promise;", errors: [{ suggestions: [] }] },
		{
			code: "class Hoge { static property = f(); }",
			// prettier-ignore
			errors: [
				{
					suggestions: [
						{
							output: "class Hoge { static property = /* #__PURE__ */ f(); }",
						},
					],
				},
			],
		},
		{
			code: "class Hoge { static { f(); } }",
			// prettier-ignore
			errors: [
				{
					suggestions: [
						{
							output: "class Hoge { static { /* #__PURE__ */ f(); } }",
						},
					],
				},
			],
			options: [{ allowInStaticBlock: false }],
		},
	],
});
