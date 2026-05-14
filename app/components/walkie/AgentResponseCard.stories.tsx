import type { Meta, StoryObj } from "@storybook/react-vite";

import { AgentResponseCard } from "./AgentResponseCard";

const meta: Meta<typeof AgentResponseCard> = {
  title: "Walkie/AgentResponseCard",
  component: AgentResponseCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    isAgentRunning: false,
    lastResponse: null,
    logDisplay: "latest",
    waitingText: "Waiting for response...",
  },
};

export default meta;
type Story = StoryObj<typeof AgentResponseCard>;

export const Hidden: Story = {};

export const Thinking: Story = {
  args: {
    isAgentRunning: true,
  },
};

export const WithResponse: Story = {
  args: {
    lastResponse: "こんにちは！何かお手伝いできることがありますか？",
  },
};

export const StreamingResponse: Story = {
  args: {
    isAgentRunning: true,
    lastResponse: "現在処理中の部分的な応答テキスト...",
  },
};

export const FullModeHidden: Story = {
  args: {
    isAgentRunning: true,
    lastResponse: "This should be hidden in full mode",
    logDisplay: "full",
  },
};

export const LongResponse: Story = {
  args: {
    lastResponse:
      "これは非常に長い応答テキストです。AIからの応答が複数行になり、カード内でスクロールが必要になる場合の表示を確認しています。OpenCode Walkie-Talkieプロジェクトは、ハンズフリーの音声インターフェースを提供し、ユーザーが移動中にAIと会話できるように設計されています。",
  },
};
