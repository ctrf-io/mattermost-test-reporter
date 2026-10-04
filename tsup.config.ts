import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		cli: "src/cli.ts",
	},
	format: ["esm"],
	dts: {
		// tsup injects baseUrl; this compatibility option applies only to its TS 6 API build.
		compilerOptions: { ignoreDeprecations: "6.0" },
		entry: {
			cli: "src/cli.ts",
		},
	},
	clean: true,
	shims: true,
	splitting: false,
	outDir: "dist",
});
