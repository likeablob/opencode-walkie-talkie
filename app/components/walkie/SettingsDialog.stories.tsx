import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ModelInfo } from "~/stores/appStore";

import { screen } from "storybook/test";

import { SettingsDialog } from "./SettingsDialog";

const models: ModelInfo[] = [
  { modelId: "anthropic/claude-3.5-sonnet", providerId: "litellm" },
  { modelId: "openai/gpt-4o", providerId: "litellm" },
  { modelId: "unsloth/gemma-4-26B-A4B", providerId: "litellm" },
  { modelId: "google/gemini-pro", providerId: "litellm" },
];

const manyModels: ModelInfo[] = [
  ...models,
  { modelId: "anthropic/claude-3-opus", providerId: "litellm" },
  { modelId: "anthropic/claude-3-haiku", providerId: "litellm" },
  { modelId: "openai/gpt-4-turbo", providerId: "litellm" },
  { modelId: "openai/gpt-3.5-turbo", providerId: "litellm" },
  { modelId: "meta/llama-3-70b", providerId: "litellm" },
  { modelId: "mistral/mistral-large", providerId: "litellm" },
];

const defaultAutoMessageSettings = {
  enabled: false,
  textJa: "これは音声セッションです。音声認識のエラーを考慮して返信してください。",
  textEn: "This is a voice session. Please consider speech recognition errors when replying.",
};

const meta: Meta<typeof SettingsDialog> = {
  title: "Walkie/SettingsDialog",
  component: SettingsDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    language: "ja",
    availableModels: models,
    filteredModelIds: [],
    gamepadConfig: {
      ptt: 1,
      accept: 3,
      reject: 2,
      interrupt: 0,
      modeToggle: 9,
      modelCycle: 8,
    },
    gamepadConnected: false,
    gamepadButtons: [],
    audioDevices: [],
    selectedMicDeviceId: null,
    audioPermissionGranted: true,
    autoMessageSettings: defaultAutoMessageSettings,
    onLanguageChange: (lang: "ja" | "en") => console.log("Language:", lang),
    onModelFilterToggle: (modelId: string) => console.log("Toggle:", modelId),
    onOpenChange: (open: boolean) => console.log("Open:", open),
    onMicDeviceChange: (deviceId: string) => console.log("Mic:", deviceId),
    onAutoMessageSettingsChange: (settings) => console.log("AutoMessage:", settings),
    onGamepadConfigChange: (config) => console.log("GamepadConfig:", config),
  },
};

export default meta;
type Story = StoryObj<typeof SettingsDialog>;

export const Default: Story = {};

export const OpenedLanguageJapanese: Story = {
  args: {
    defaultOpen: true,
  },
};

export const OpenedLanguageEnglish: Story = {
  args: {
    language: "en",
    defaultOpen: true,
  },
};

export const OpenedModelsTab: Story = {
  args: {
    language: "en",
    defaultOpen: true,
  },
  play: async ({ userEvent }) => {
    await screen.findByRole("button", { name: /General/i });
    const modelsButton = screen.getByRole("button", { name: /Models/i });
    await userEvent.click(modelsButton);
    await screen.findByText("Model Filter");
  },
};

export const OpenedModelsFiltered: Story = {
  args: {
    language: "en",
    availableModels: manyModels,
    filteredModelIds: ["anthropic/claude-3.5-sonnet", "openai/gpt-4o"],
    defaultOpen: true,
  },
  play: async ({ userEvent }) => {
    await screen.findByRole("button", { name: /General/i });
    const modelsButton = screen.getByRole("button", { name: /Models/i });
    await userEvent.click(modelsButton);
    await screen.findByText("Model Filter");
    await screen.findByText(/2 models selected/);
  },
};

export const LanguageSwitch: Story = {
  args: {
    defaultOpen: true,
  },
  play: async ({ userEvent }) => {
    await screen.findByText("Language");
    const selectTriggers = screen.getAllByRole("combobox");
    const languageTrigger = selectTriggers[0];
    await userEvent.click(languageTrigger);
    const enOption = await screen.findByRole("option", { name: "English" });
    await userEvent.click(enOption);
  },
};

export const ModelFilterToggle: Story = {
  args: {
    language: "en",
    availableModels: manyModels,
    filteredModelIds: ["anthropic/claude-3.5-sonnet", "openai/gpt-4o"],
    defaultOpen: true,
  },
  play: async ({ userEvent }) => {
    await screen.findByRole("button", { name: /General/i });
    const modelsButton = screen.getByRole("button", { name: /Models/i });
    await userEvent.click(modelsButton);
    await screen.findByText(/2 models selected/);
    const claudeButton = screen.getByRole("button", { name: /claude-3.5-sonnet/i });
    await userEvent.click(claudeButton);
  },
};
