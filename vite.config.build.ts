import { defineConfig } from "vite";
import sharedConfig from "./vite.config.shared";
import path from "path";
import fg from "fast-glob";

export default defineConfig({
  ...sharedConfig,
  plugins: [
    ...sharedConfig.plugins,
    {
      name: "watch-external", // https://stackoverflow.com/questions/63373804/rollup-watch-include-directory/63548394#63548394
      async buildStart() {
        const files = await fg(["public/**/*"]);
        for (const file of files) {
          this.addWatchFile(file);
        }
      },
    },
  ],
  build: {
    minify: false,
    lib: {
      formats: ["es"],
      entry: [
        path.resolve(__dirname, "src/main.tsx"),
        path.resolve(__dirname, "src/popup.tsx"),
        path.resolve(__dirname, "src/background.ts"),
      ],
      name: "tree_tabs_front",
      fileName: (format, entry) => `${entry}.${format}.js`,
    },
    rollupOptions: {
      output: {
        manualChunks: {},
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
