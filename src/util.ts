import { ESLintUtils, type JSONSchema } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator.withoutDocs;

type TypedJsonSchema<T = unknown> = JSONSchema.JSONSchema4 & { __?: T };

export type RuleOptions<T> = T extends TypedJsonSchema<infer U> ? U : never;

export const jsonSchema = {
	object: <T>(
		properties: { [P in keyof T]: TypedJsonSchema<T[P]> },
	): TypedJsonSchema<Partial<T>> => ({ type: "object", properties }),
	array: <T>(items: TypedJsonSchema<T>): TypedJsonSchema<T[]> => ({
		type: "array",
		items,
	}),
	boolean: (): TypedJsonSchema<boolean> => ({ type: "boolean" }),
	string: (schema?: {
		maxLength?: number;
		minLength?: number;
		pattern?: string;
	}): TypedJsonSchema<string> => ({
		type: "string",
		...schema,
	}),
};
