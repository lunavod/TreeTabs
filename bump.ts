import fs from "fs/promises";
import prettier from "prettier";
import arg from "arg";

const args = arg({
  "--version": String,
});

const VER = args["--version"];
if (!VER) {
  throw new Error("No version specified");
}

console.log(`Setting version ${VER}`);

const pckg = JSON.parse((await fs.readFile("package.json")).toString());

pckg.version = VER;

await fs.writeFile(
  "package.json",
  await prettier.format(JSON.stringify(pckg, null, 2), { parser: "json" })
);

console.log("Bumped package.json");

const manifest = JSON.parse(
  (await fs.readFile("public/manifest.json")).toString()
);

manifest.version = VER;

await fs.writeFile(
  "public/manifest.json",
  await prettier.format(JSON.stringify(manifest, null, 2), { parser: "json" })
);

console.log("Bumped manifest.json");
