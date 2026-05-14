import type { Meta, StoryObj } from "@storybook/react-vite";

import { ControlButtons } from "./ControlButtons";

const meta: Meta<typeof ControlButtons> = {
  title: "Walkie/ControlButtons",
  component: ControlButtons,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    inputState: "idle",
    isPlaying: false,
    isAgentRunning: false,
    onAccept: () => console.log("Accept"),
    onReject: () => console.log("Reject"),
    onInterrupt: () => console.log("Interrupt"),
  },
};

export default meta;
type Story = StoryObj<typeof ControlButtons>;

export const Idle: Story = {};

export const Confirming: Story = {
  args: {
    inputState: "confirming",
  },
};

export const Playing: Story = {
  args: {
    isPlaying: true,
  },
};

export const AgentRunning: Story = {
  args: {
    isAgentRunning: true,
  },
};
