import { RuleTester, type TestCaseError } from "@typescript-eslint/rule-tester";
import { type MessageIds, name, rule } from "./pure-module";

const ruleTester = new RuleTester();

const error = (
	suggestions: readonly string[] = [],
): TestCaseError<MessageIds> => ({
	messageId: "moduleSideEffectMessage",
	suggestions: suggestions.map((output) => ({
		messageId: "insertCommentMessage",
		output,
	})),
});

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
			errors: [error(["/* #__PURE__ */ f();"])],
		},
		{
			code: "f``;",
			errors: [error(["/* #__PURE__ */ f``;"])],
		},
		{
			code: "new Hoge;",
			errors: [error(["/* #__PURE__ */ new Hoge;"])],
			options: [{ allowNew: false }],
		},
		{ code: "delete object.property;", errors: [error()] },
		{ code: "i++;", errors: [error()] },
		{ code: "i = 1;", errors: [error()] },
		{ code: "throw error;", errors: [error()] },
		{ code: "await promise;", errors: [error()] },
		{
			code: "class Hoge { static property = f(); }",
			errors: [
				error(["class Hoge { static property = /* #__PURE__ */ f(); }"]),
			],
		},
		{
			code: "class Hoge { static { f(); } }",
			errors: [error(["class Hoge { static { /* #__PURE__ */ f(); } }"])],
			options: [{ allowInStaticBlock: false }],
		},
	],
});
