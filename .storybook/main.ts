import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../app/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: "@storybook/react-vite",
  core: {
    disableTelemetry: true,
  },
  async viteFinal(viteConfig) {
    const filteredPlugins = (viteConfig.plugins || []).flat().filter((plugin) => {
      if (typeof plugin === "object" && plugin !== null && "name" in plugin) {
        const name = (plugin as { name?: string }).name;
        return !name?.includes("react-router") && !name?.includes("vite-plugin-pwa");
      }
      return true;
    });

    return {
      ...viteConfig,
      plugins: [...filteredPlugins, tailwindcss()],
      resolve: {
        ...viteConfig.resolve,
        alias: {
          ...viteConfig.resolve?.alias,
          "~": path.resolve(__dirname, "../app"),
          "@": path.resolve(__dirname, "../app"),
        },
      },
    };
  },
};

export default config;
