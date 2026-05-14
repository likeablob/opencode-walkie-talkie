import type { Meta, StoryObj } from "@storybook/react-vite";

import { Header } from "./Header";

const meta: Meta<typeof Header> = {
  title: "Walkie/Header",
  component: Header,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    title: "OpenCode Walkie-Talkie",
    gamepadConnected: false,
    gamepadId: null,
    sseConnectionState: "connected",
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {};

export const WithGamepad: Story = {
  args: {
    gamepadConnected: true,
    gamepadId: "8BitDo Zero 2 Gamepad Controller",
  },
};

export const LongGamepadId: Story = {
  args: {
    gamepadConnected: true,
    gamepadId: "8BitDo Zero 2 Gamepad Controller - Bluetooth Connected Device Name",
  },
};

export const SSEDisconnected: Story = {
  args: {
    sseConnectionState: "disconnected",
  },
};

export const SSEReconnecting: Story = {
  args: {
    gamepadConnected: true,
    gamepadId: "8BitDo Zero 2 Gamepad Controller",
    sseConnectionState: "reconnecting",
  },
};
