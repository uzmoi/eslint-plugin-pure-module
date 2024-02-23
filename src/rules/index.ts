import type { TSESLint } from "@typescript-eslint/utils";
import * as pureModule from "./pure-module";

export const rules: TSESLint.Linter.PluginRules = {
	[pureModule.name]: pureModule.rule,
};
