import { build } from "esbuild";

await build({
  entryPoints: ["worker/embed.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  jsx: "automatic",
  loader: { ".css": "text" },
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: "public/widget.js",
});
console.log("widget.js built");