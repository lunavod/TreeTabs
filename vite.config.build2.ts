import { defineConfig } from "vite";
import { resolve } from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { build } from "vite";
import { fileURLToPath } from "url";
import sharedConfig from "./vite.config.shared";

// https://vitejs.dev/config/
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const inputFiles = [
  {
    outputFileName: "background.es",
    inputFilePath: "src/background.ts",
    emptyOutDir: true,
    cssName: "background.css",
    // staticTargets: [
    //   { src: resolve(__dirname, "src/assets/fonts/*"), dest: "fonts" },
    //   { src: resolve(__dirname, "src/assets/icons/*"), dest: "icons" },
    // ],
  },
  {
    outputFileName: "main.es",
    inputFilePath: "src/main.tsx",
    cssName: "main-styles.css",
  },
  {
    outputFileName: "popup.es",
    inputFilePath: "src/popup.tsx",
    cssName: "popup-styles.css",
  },
];

const buildConfig = (fileConfig) => {
  return defineConfig({
    ...sharedConfig,
    build: {
      emptyOutDir: fileConfig.emptyOutDir == true,
      lib: {
        entry: {
          [fileConfig.outputFileName]: resolve(
            __dirname,
            fileConfig.inputFilePath
          ),
        },
        formats: ["es"],
      },
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name == "style.css") return fileConfig.cssName;
            return assetInfo.name;
          },
        },
      },
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  });
};

const finalBuild = inputFiles.map((fileConfig) => buildConfig(fileConfig));

async function buildPackages() {
  for (const config of finalBuild) {
    await build(config);
  }
}

// export default finaBuild;
export default buildPackages();
