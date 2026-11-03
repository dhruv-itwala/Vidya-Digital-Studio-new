import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

describe("VidyaCrmApk Configuration & Asset Verification", () => {
  test("1.1 app.json has correct app name, package name, and version", () => {
    const appJsonPath = path.join(rootDir, "app.json");
    assert.ok(fs.existsSync(appJsonPath), "app.json must exist");

    const content = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
    const expo = content.expo;
    assert.ok(expo, "app.json must have expo configuration");

    assert.equal(expo.name, "MyStaff", "App name must be MyStaff");
    assert.equal(
      expo.android.package,
      "mystaff.vidyadigitalstudio.com",
      "Package name must be mystaff.vidyadigitalstudio.com",
    );
    assert.equal(expo.version, "1.3.90", "Version must match VIDYACRM version 1.3.90");
    assert.ok(
      ["default", "portrait", "landscape"].includes(expo.orientation),
      "orientation must be a valid Expo/Android orientation ('default', 'portrait', or 'landscape')",
    );
    assert.notEqual(expo.orientation, "any", "orientation must not be 'any' as AAPT rejects it");
    assert.ok(expo.android.versionCode > 0, "versionCode must be a positive integer");
  });

  test("1.2 app.json includes necessary native Android permissions and cleartext traffic", () => {
    const appJsonPath = path.join(rootDir, "app.json");
    const content = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
    const android = content.expo.android;

    assert.ok(android.permissions.includes("INTERNET"), "Must include INTERNET permission");
    assert.ok(android.permissions.includes("CAMERA"), "Must include CAMERA permission");
    assert.ok(
      android.permissions.includes("ACCESS_NETWORK_STATE"),
      "Must include ACCESS_NETWORK_STATE",
    );

    const buildProps = content.expo.plugins.find(
      (p) => Array.isArray(p) && p[0] === "expo-build-properties",
    );
    assert.ok(buildProps, "Must include expo-build-properties plugin");
    assert.equal(
      buildProps[1].android.usesCleartextTraffic,
      true,
      "usesCleartextTraffic must be true for HTTP endpoints",
    );
  });

  test("1.3 Required branding and splash assets exist", () => {
    const assetsDir = path.join(rootDir, "assets");
    assert.ok(fs.existsSync(path.join(assetsDir, "icon.png")), "icon.png must exist");
    assert.ok(
      fs.existsSync(path.join(assetsDir, "adaptive-icon.png")),
      "adaptive-icon.png must exist",
    );
    assert.ok(fs.existsSync(path.join(assetsDir, "splash.png")), "splash.png must exist");
  });

  test("1.4 package.json is valid with proper dependencies", () => {
    const pkgPath = path.join(rootDir, "package.json");
    assert.ok(fs.existsSync(pkgPath), "package.json must exist");

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    assert.equal(pkg.main, "index.ts");
    assert.ok(pkg.dependencies["react-native-webview"], "Must have react-native-webview");
    assert.ok(pkg.dependencies["expo"], "Must have expo dependency");
  });
});

