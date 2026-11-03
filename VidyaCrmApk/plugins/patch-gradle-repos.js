// VidyaCrmApk/scripts/patch-gradle-repos.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultAndroidDir = path.resolve(__dirname, "..", "android");

/**
 * Patches android/settings.gradle and android/build.gradle to guarantee
 * mavenCentral() is present in all Gradle repository blocks.
 */
export function patchGradleRepositories(androidDir = defaultAndroidDir) {
  const settingsPath = path.join(androidDir, "settings.gradle");
  const buildGradlePath = path.join(androidDir, "build.gradle");

  let modifiedSettings = false;
  let modifiedBuild = false;

  // 1. Patch settings.gradle
  if (fs.existsSync(settingsPath)) {
    let settingsContent = fs.readFileSync(settingsPath, "utf8");

    const pluginRepoBlock = `
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }`;

    if (settingsContent.includes("pluginManagement {")) {
      const pIdx = settingsContent.indexOf("pluginManagement {");
      const nextBrace = settingsContent.indexOf("}", pIdx);
      const section = settingsContent.substring(pIdx, nextBrace);

      if (!section.includes("mavenCentral")) {
        settingsContent = settingsContent.replace(
          "pluginManagement {",
          `pluginManagement {${pluginRepoBlock}`,
        );
        modifiedSettings = true;
      }
    } else {
      settingsContent = `pluginManagement {${pluginRepoBlock}\n}\n${settingsContent}`;
      modifiedSettings = true;
    }

    if (!settingsContent.includes("dependencyResolutionManagement")) {
      settingsContent += `
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven { url "https://www.jitpack.io" }
    }
}
`;
      modifiedSettings = true;
    }

    if (modifiedSettings) {
      fs.writeFileSync(settingsPath, settingsContent, "utf8");
      console.log("✅ [patch-gradle] Updated settings.gradle with mavenCentral() repository blocks.");
    } else {
      console.log("ℹ️ [patch-gradle] settings.gradle already contains required repositories.");
    }
  } else {
    console.warn(`⚠️ [patch-gradle] settings.gradle not found at ${settingsPath}`);
  }

  // 2. Patch root build.gradle
  if (fs.existsSync(buildGradlePath)) {
    let buildContent = fs.readFileSync(buildGradlePath, "utf8");

    if (buildContent.includes("buildscript {")) {
      if (!buildContent.includes("mavenCentral()")) {
        buildContent = buildContent.replace(
          /buildscript\s*\{[^}]*repositories\s*\{/,
          (match) => `${match}\n        google()\n        mavenCentral()`,
        );
        modifiedBuild = true;
      }
    }

    if (buildContent.includes("allprojects {")) {
      if (!buildContent.includes("mavenCentral()")) {
        buildContent = buildContent.replace(
          /allprojects\s*\{[^}]*repositories\s*\{/,
          (match) => `${match}\n        google()\n        mavenCentral()`,
        );
        modifiedBuild = true;
      }
    }

    if (modifiedBuild) {
      fs.writeFileSync(buildGradlePath, buildContent, "utf8");
      console.log("✅ [patch-gradle] Updated build.gradle with mavenCentral() repositories.");
    } else {
      console.log("ℹ️ [patch-gradle] build.gradle already contains required repositories.");
    }
  } else {
    console.warn(`⚠️ [patch-gradle] build.gradle not found at ${buildGradlePath}`);
  }

  return { modifiedSettings, modifiedBuild };
}

// Execute if called directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  patchGradleRepositories();
}
