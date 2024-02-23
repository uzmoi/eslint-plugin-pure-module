import type { TSESLint } from "@typescript-eslint/utils";
import { name, version } from "../package.json";
import { rules } from "./rules";

const plugin: TSESLint.Linter.Plugin = {
	meta: { name, version },
	rules,
};

export = plugin;
