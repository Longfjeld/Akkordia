import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const source = resolve("node_modules/@azure/msal-browser/lib/msal-browser.min.js");
const licenseSource = resolve("node_modules/@azure/msal-browser/LICENSE");
const destination = resolve("vendor/msal-browser.min.js");
const licenseDestination = resolve("vendor/MSAL-LICENSE.txt");

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
await copyFile(licenseSource, licenseDestination);

const packageJson = JSON.parse(await readFile("node_modules/@azure/msal-browser/package.json", "utf8"));
await writeFile(
  resolve("vendor/MSAL-VERSION.txt"),
  `@azure/msal-browser ${packageJson.version}\n`,
  "utf8"
);

console.log(`Vendored @azure/msal-browser ${packageJson.version} to vendor/`);
