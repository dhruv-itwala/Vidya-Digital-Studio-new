// VidyaCrmApk/plugins/withMavenCentral.cjs
const { withSettingsGradle, withProjectBuildGradle } = require("@expo/config-plugins");

/**
 * Expo Config Plugin to ensure mavenCentral() is included in both pluginManagement
 * and dependencyResolutionManagement, fixing Gradle resolution for com.facebook.react.settings
 * and com.google.code.gson:gson:2.9.1.
 */
const withMavenCentral = (config) => {
  // 1. Ensure pluginManagement & dependencyResolutionManagement include mavenCentral in settings.gradle
  config = withSettingsGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;

    const pluginRepoBlock = `
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }`;

    if (contents.includes("pluginManagement {")) {
      const pIdx = contents.indexOf("pluginManagement {");
      const nextBrace = contents.indexOf("}", pIdx);
      const section = contents.substring(pIdx, nextBrace);

      if (!section.includes("mavenCentral")) {
        contents = contents.replace(
          "pluginManagement {",
          `pluginManagement {${pluginRepoBlock}`,
        );
      }
    } else {
      contents = `pluginManagement {${pluginRepoBlock}\n}\n${contents}`;
    }

    if (!contents.includes("dependencyResolutionManagement")) {
      contents += `
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven { url "https://www.jitpack.io" }
    }
}
`;
    }

    modConfig.modResults.contents = contents;
    return modConfig;
  });

  // 2. Ensure root build.gradle repositories include mavenCentral()
  config = withProjectBuildGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;

    if (contents.includes("buildscript {")) {
      const bsIdx = contents.indexOf("buildscript {");
      const bsEnd = contents.indexOf("}", bsIdx);
      const bsSection = contents.substring(bsIdx, bsEnd);
      if (!bsSection.includes("mavenCentral()")) {
        contents = contents.replace(
          /buildscript\s*\{[^}]*repositories\s*\{/,
          (match) => `${match}\n        google()\n        mavenCentral()`,
        );
      }
    }

    if (contents.includes("allprojects {")) {
      const apIdx = contents.indexOf("allprojects {");
      const apEnd = contents.indexOf("}", apIdx);
      const apSection = contents.substring(apIdx, apEnd);
      if (!apSection.includes("mavenCentral()")) {
        contents = contents.replace(
          /allprojects\s*\{[^}]*repositories\s*\{/,
          (match) => `${match}\n        google()\n        mavenCentral()`,
        );
      }
    }

    modConfig.modResults.contents = contents;
    return modConfig;
  });

  return config;
};

module.exports = withMavenCentral;

