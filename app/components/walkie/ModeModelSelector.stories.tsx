import type { Meta, StoryObj } from "@storybook/react-vite";

import { ModeModelSelector } from "./ModeModelSelector";

const meta: Meta<typeof ModeModelSelector> = {
  title: "Walkie/ModeModelSelector",
  component: ModeModelSelector,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    mode: "plan",
    model: {
      modelId: "anthropic/claude-3.5-sonnet",
      providerId: "litellm",
    },
    onModeToggle: () => console.log("Mode Toggle"),
    onModelCycle: () => console.log("Model Cycle"),
  },
};

export default meta;
type Story = StoryObj<typeof ModeModelSelector>;

export const PlanMode: Story = {};

export const BuildMode: Story = {
  args: {
    mode: "build",
  },
};

export const NoModel: Story = {
  args: {
    mode: "build",
    model: null,
  },
};

export const LongModelId: Story = {
  args: {
    mode: "build",
    model: {
      modelId: "unsloth/gemma-4-26B-A4B-quantized-very-long-name",
      providerId: "litellm",
    },
  },
};
