import type { Meta, StoryObj } from "@storybook/react-vite";

import { ControlBar } from "./ControlBar";

const meta: Meta<typeof ControlBar> = {
  title: "Walkie/ControlBar",
  component: ControlBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    logDisplay: "latest",
    wakeLockActive: true,
    locked: false,
    onDisplayToggle: () => console.log("Display Toggle"),
    onWakeLockToggle: () => console.log("Wake Lock Toggle"),
    onLockToggle: () => console.log("Lock Toggle"),
  },
};

export default meta;
type Story = StoryObj<typeof ControlBar>;

export const LatestModeWakeOnNoGamepad: Story = {};

export const FullModeWakeOnGamepadConnected: Story = {
  args: {
    logDisplay: "full",
  },
};

export const WakeLockOffLocked: Story = {
  args: {
    wakeLockActive: false,
    locked: true,
  },
};
