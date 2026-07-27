import type { Plugin } from "vite";

// `protoc-gen-js` only knows how to emit CommonJS, so the generated message
// stubs under src/pb are CJS modules living in an otherwise-ESM source tree.
// Rolldown handles that natively when bundling for production, but the dev
// server and Vitest serve source files as-is, where `require` and `exports`
// are undefined.
//
// The generated files use a very narrow slice of CommonJS, so converting them
// is a small, predictable job:
//
//   * every `require` is a top-level `var <name> = require("<spec>");`
//   * the only write to `exports` is a single trailing
//     `goog.object.extend(exports, proto.<package>);`, which copies in every
//     symbol the file previously announced via `goog.exportSymbol`.
//
// Anything that does not match that shape is left alone.

const PB_MODULE = /\/src\/pb\/[^/]+\.js$/;
const REQUIRE = /^var (\w+) = require\((['"])(.+?)\2\);$/gm;
const EXPORT_ALL = /goog\.object\.extend\(exports, (proto(?:\.\w+)*)\);/;
const EXPORT_SYMBOL = /goog\.exportSymbol\((['"])(proto(?:\.\w+)+)\1/g;

export function protobufCommonJs(): Plugin {
  return {
    name: "crossme:protobuf-commonjs",
    enforce: "pre",
    apply: "serve",
    transform(code, id) {
      const exportAll = PB_MODULE.test(id) ? EXPORT_ALL.exec(code) : null;
      if (!exportAll) {
        return null;
      }
      const pkg = exportAll[1];

      const imports: string[] = [];
      const body = code.replace(REQUIRE, (_match, name: string, _q, spec) => {
        const local = `__cjs_import_${imports.length}__`;
        imports.push(`import ${local} from ${JSON.stringify(spec)};`);
        return `var ${name} = ${local};`;
      });

      // Top-level symbols of the package become the module's named exports.
      // Nested ones (`proto.crossme.Fill.Cell`) are reached through their
      // parent, so they are deliberately skipped.
      const exported = new Set<string>();
      for (const [, , symbol] of code.matchAll(EXPORT_SYMBOL)) {
        if (!symbol.startsWith(`${pkg}.`)) {
          continue;
        }
        const name = symbol.slice(pkg.length + 1);
        if (!name.includes(".")) {
          exported.add(name);
        }
      }

      return {
        code: [
          ...imports,
          "const exports = {};",
          body,
          `export const { ${[...exported].join(", ")} } = exports;`,
          "export default exports;",
        ].join("\n"),
        map: null,
      };
    },
  };
}
