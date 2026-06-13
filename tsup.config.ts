import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		cli: "src/cli.ts",
	},
	format: ["esm"],
	dts: {
		entry: {
			cli: "src/cli.ts",
		},
	},
	clean: true,
	shims: true,
	splitting: false,
	outDir: "dist",
});
