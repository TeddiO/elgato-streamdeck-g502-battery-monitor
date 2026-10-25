import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import url from "node:url";

const isWatching = !!process.env.ROLLUP_WATCH;
const sdPlugin = "com.teddi.g502-battery-monitor.sdPlugin";
const require = createRequire(import.meta.url);
const compiler = path.join(path.dirname(require.resolve("typescript/package.json")), "bin", "tsc");
const buildDir = path.resolve(".build");

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
	input: ".build/plugin.js",
	watch: {
		exclude: ".build/**"
	},
	output: {
		file: `${sdPlugin}/bin/plugin.js`,
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
			return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href;
		}
	},
	plugins: [
		{
			name: "compile-typescript",
			buildStart: function () {
				this.addWatchFile(`${sdPlugin}/manifest.json`);
				this.addWatchFile("tsconfig.json");
				this.addWatchFile("src");
				for (const file of readdirSync("src", { recursive: true })) {
					if (file.endsWith(".ts")) {
						this.addWatchFile(path.join("src", file));
					}
				}
				execFileSync(process.execPath, [compiler, "--project", "tsconfig.json"], { stdio: "inherit" });
			},
			load(id) {
				id = path.normalize(id);
				if (!id.startsWith(`${buildDir}${path.sep}`) || !id.endsWith(".js")) {
					return null;
				}
				const map = JSON.parse(readFileSync(`${id}.map`, "utf8"));
				map.sources = map.sources.map(source => path.resolve(path.dirname(id), source));
				return { code: readFileSync(id, "utf8"), map };
			},
			shouldTransformCachedModule({ id }) {
				return path.normalize(id).startsWith(`${buildDir}${path.sep}`);
			},
		},
		nodeResolve({
			browser: false,
			exportConditions: ["node"],
			preferBuiltins: true
		}),
		commonjs(),
		!isWatching && terser(),
		{
			name: "emit-module-package-file",
			generateBundle() {
				this.emitFile({ fileName: "package.json", source: `{ "type": "module" }`, type: "asset" });
			}
		}
	]
};

export default config;
