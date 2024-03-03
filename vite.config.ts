import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
import reactCssModule from "./vite-tools/react-css-modules";
import sassDts from "vite-plugin-sass-dts";
import svgr from "vite-plugin-svgr";

const generateScopedName = "[path]___[name]__[local]";
export default defineConfig({
  plugins: [
    sassDts(),
    svgr({
      exportAsDefault: true,
      svgrOptions: {
        typescript: false,
        icon: "1em",
        replaceAttrValues: { "#323232": "currentColor" },
      },
    }),
    react(),
    reactCssModule({
      generateScopedName,
      excludeFiles: [/main\.tsx/],
      filetypes: {
        ".css": {
          syntax: "postcss",
        },
      },
    }),
  ],
  css: {
    modules: {
      generateScopedName,
      localsConvention: "camelCase",
    },
  },
});
