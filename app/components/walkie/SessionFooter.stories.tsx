import type { Meta, StoryObj } from "@storybook/react-vite";

import { SessionFooter } from "./SessionFooter";

const meta: Meta<typeof SessionFooter> = {
  title: "Walkie/SessionFooter",
  component: SessionFooter,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    sessionTitle: "OWT: Python ファイルの読み書き",
    onNewSession: () => console.log("New Session"),
    onOpenSessionList: () => console.log("Open Session List"),
  },
};

export default meta;
type Story = StoryObj<typeof SessionFooter>;

export const WithSession: Story = {};

export const NoSession: Story = {
  args: {
    sessionTitle: null,
  },
};

export const LongTitle: Story = {
  args: {
    sessionTitle: "OWT: Very long title that might overflow",
  },
};
