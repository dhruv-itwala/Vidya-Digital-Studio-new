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

  test("1.5 patchGradleRepositories script accurately injects mavenCentral into settings.gradle and build.gradle", async () => {
    const { patchGradleRepositories } = await import("../plugins/patch-gradle-repos.js");
    const os = await import("node:os");
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vds-gradle-test-"));

    try {
      const mockSettings = `pluginManagement {
  includeBuild(new File(["node", "--print", "require.resolve('@react-native/gradle-plugin/package.json')"].execute(null, rootDir).text.trim()).getParentFile().toString())
}
plugins { id("com.facebook.react.settings") }
include ':app'
`;
      const mockBuild = `buildscript {
    repositories {
        google()
    }
}
allprojects {
    repositories {
        google()
    }
}
`;
      fs.writeFileSync(path.join(tmpDir, "settings.gradle"), mockSettings, "utf8");
      fs.writeFileSync(path.join(tmpDir, "build.gradle"), mockBuild, "utf8");

      const result = patchGradleRepositories(tmpDir);
      assert.equal(result.modifiedSettings, true);
      assert.equal(result.modifiedBuild, true);

      const patchedSettings = fs.readFileSync(path.join(tmpDir, "settings.gradle"), "utf8");
      assert.ok(patchedSettings.includes("mavenCentral()"), "settings.gradle must include mavenCentral()");
      assert.ok(
        patchedSettings.includes("dependencyResolutionManagement"),
        "settings.gradle must include dependencyResolutionManagement",
      );

      const patchedBuild = fs.readFileSync(path.join(tmpDir, "build.gradle"), "utf8");
      assert.ok(patchedBuild.includes("mavenCentral()"), "build.gradle must include mavenCentral()");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("1.6 withMavenCentral Expo config plugin file exists and loads cleanly", () => {
    const pluginPath = path.join(rootDir, "plugins", "withMavenCentral.cjs");
    assert.ok(fs.existsSync(pluginPath), "withMavenCentral.cjs must exist");
  });

  test("1.7 App.tsx provides in-app server URL configuration and persistent storage", () => {
    const appTsxPath = path.join(rootDir, "App.tsx");
    assert.ok(fs.existsSync(appTsxPath), "App.tsx must exist");

    const appCode = fs.readFileSync(appTsxPath, "utf8");
    assert.ok(
      appCode.includes("expo-secure-store"),
      "App.tsx must import and use expo-secure-store for persisting target CRM URL",
    );
    assert.ok(
      appCode.includes("Save & Connect") || appCode.includes("handleSaveUrl"),
      "App.tsx must include in-app URL update and connect handling",
    );
    assert.ok(
      appCode.includes("192.168.0.149:20254"),
      "App.tsx must include default Studio LAN port 20254 fallback",
    );
  });

  test("1.8 GitHub Actions workflow provides crm_url input parameter", () => {
    const wfPath = path.resolve(rootDir, "..", ".github", "workflows", "build-vidyacrm-apk.yml");
    assert.ok(fs.existsSync(wfPath), "build-vidyacrm-apk.yml must exist");

    const wfContent = fs.readFileSync(wfPath, "utf8");
    assert.ok(
      wfContent.includes("crm_url:"),
      "Workflow must include crm_url input for specifying server URL",
    );
    assert.ok(
      !wfContent.includes("http://backend.vidyadigitalstudio.com"),
      "Workflow must not default to broken backend domain http://backend.vidyadigitalstudio.com",
    );
  });
});

