import type { TSESLint, TSESTree } from "@typescript-eslint/utils";
import esquery from "esquery";
import type * as esTree from "estree";
import { type RuleOptions, createRule, jsonSchema } from "../util";

// https://github.com/rollup/rollup/pull/5024
const _isPureFunctionComment = (comment: TSESTree.Comment): boolean =>
	/[#@]__NO_SIDE_EFFECTS__/.test(comment.value);

const isPureComment = (comment: TSESTree.Comment): boolean =>
	/[#@]__PURE__/.test(comment.value);

const parsePattern = (filter: string) => {
	const ancestryAttributes: string[] = [];
	let selector = "";
	const xs = filter.split(".").reverse();
	for (const [i, name] of xs.entries()) {
		const ancestryAttribute = [
			...ancestryAttributes,
			i === xs.length - 1 ? (name === "*" ? "type" : "name") : "property.name",
		].join(".");
		const nameRe = name.replace(/\*/g, ".+");
		selector += `[${ancestryAttribute}=/^${nameRe}$/]`;
		const isMetaProperty = filter.startsWith("import.") && i === xs.length - 2;
		ancestryAttributes.push(isMetaProperty ? "meta" : "object");
	}

	return esquery.parse(selector);
};

// TODO: Support __NO_SIDE_EFFECTS__.
const isPureFunction = (
	node: TSESTree.Expression,
	pureFunctions: readonly string[] = [],
): boolean => {
	const isInPureFunctionsList = pureFunctions.some((pattern) =>
		esquery.matches(node as esTree.Node, parsePattern(pattern)),
	);
	if (isInPureFunctionsList) {
		return true;
	}

	// isPureFunctionComment
	return false;
};

const checkNodeType = [
	"AwaitExpression",
	"UpdateExpression",
	"AssignmentExpression",
	"UnaryExpression",
	"ThrowStatement",
	"NewExpression",
	"TaggedTemplateExpression",
	"CallExpression",
] as const;

const pureCommentSupportNodeType = new Set<`${TSESTree.AST_NODE_TYPES}`>([
	"NewExpression",
	"TaggedTemplateExpression",
	"CallExpression",
]);

type CheckNode = Extract<
	TSESTree.Node,
	{ type: (typeof checkNodeType)[number] }
>;

const isPureNode = (
	node: CheckNode,
	source: TSESLint.SourceCode,
	options: RuleOptions<typeof optionSchema>,
): boolean => {
	switch (node.type) {
		case "AwaitExpression": {
			return !!options.allowAwait;
		}
		case "UpdateExpression":
		case "AssignmentExpression": {
			return !!options.allowAssign;
		}
		case "UnaryExpression": {
			return !!options.allowDelete || node.operator !== "delete";
		}
		case "ThrowStatement": {
			return !!options.allowThrow;
		}
		case "NewExpression": {
			return (
				!!options.allowNew || source.getCommentsBefore(node).some(isPureComment)
			);
		}
		case "TaggedTemplateExpression": {
			return (
				!!(options.allowTaggedTemplate ?? options.allowCall) ||
				source.getCommentsBefore(node).some(isPureComment) ||
				isPureFunction(node.tag, options.pureFunctions)
			);
		}
		case "CallExpression": {
			return (
				!!options.allowCall ||
				source.getCommentsBefore(node).some(isPureComment) ||
				node.callee.type === "Super" ||
				isPureFunction(node.callee, options.pureFunctions)
			);
		}
		default: {
			throw new Error(`Unknown node type ${node.type}.`);
		}
	}
};

const functionNodeType = new Set<`${TSESTree.AST_NODE_TYPES}`>([
	"MethodDefinition",
	"FunctionDeclaration",
	"FunctionExpression",
	"ArrowFunctionExpression",
]);

const isInFunction = (
	ancestors: readonly TSESTree.Node[],
	options: RuleOptions<typeof optionSchema>,
): boolean => {
	return ancestors.some((node) => {
		return (
			functionNodeType.has(node.type) ||
			(node.type === "PropertyDefinition" && !node.static) ||
			(options.allowInStaticBlock && node.type === "StaticBlock")
		);
	});
};

export type MessageIds = "insertCommentMessage" | "moduleSideEffectMessage";

const optionSchema = jsonSchema.object({
	pureFunctions: jsonSchema.array(
		jsonSchema.string({
			pattern: String(/^(\*|[$\w]+)(\.(\*|[$\w]+))*$/),
		}),
	),
	allowCall: jsonSchema.boolean(),
	allowTaggedTemplate: jsonSchema.boolean(),
	allowNew: jsonSchema.boolean(),
	allowAssign: jsonSchema.boolean(),
	allowDelete: jsonSchema.boolean(),
	allowThrow: jsonSchema.boolean(),
	allowAwait: jsonSchema.boolean(),
	allowInStaticBlock: jsonSchema.boolean(),
});

export const name = "pure-module";

export const rule = createRule<[RuleOptions<typeof optionSchema>], MessageIds>({
	// name,
	meta: {
		type: "problem",
		docs: {
			description: "Disallow side effects at the top level of the module.",
		},
		hasSuggestions: true,
		messages: {
			insertCommentMessage: "Insert __PURE__ comment",
			moduleSideEffectMessage: "Toplevel side effect.",
		},
		schema: [optionSchema],
	},
	defaultOptions: [{}],
	create(context, optionsWithDefault) {
		const options: RuleOptions<typeof optionSchema> = {
			allowNew: true,
			allowInStaticBlock: true,
			...optionsWithDefault[0],
		};

		const checkSideEffect = (node: CheckNode) => {
			if (isPureNode(node, context.sourceCode, options)) {
				return;
			}
			if (isInFunction(context.sourceCode.getAncestors(node), options)) {
				return;
			}

			const suggestions: TSESLint.SuggestionReportDescriptor<MessageIds>[] = [];
			if (pureCommentSupportNodeType.has(node.type)) {
				suggestions.push({
					messageId: "insertCommentMessage",
					fix(fixer) {
						return fixer.insertTextBefore(node, "/* #__PURE__ */ ");
					},
				});
			}

			context.report({
				node,
				messageId: "moduleSideEffectMessage",
				suggest: suggestions,
			});
		};

		const listener: TSESLint.RuleListener = {};

		for (const type of checkNodeType) {
			listener[type] = checkSideEffect;
		}

		return listener;
	},
});
