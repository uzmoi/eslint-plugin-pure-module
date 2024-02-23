// @ts-check

/** @type {import("@jest/types").Config.InitialOptions} */
// biome-ignore lint/style/noDefaultExport: config file
export default {
	coverageDirectory: "coverage",
	coverageProvider: "v8",
	transform: { "\\.ts$": "@swc/jest" },
};
