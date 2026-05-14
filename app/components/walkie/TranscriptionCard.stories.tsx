import type { Meta, StoryObj } from "@storybook/react-vite";

import { TranscriptionCard } from "./TranscriptionCard";

const meta: Meta<typeof TranscriptionCard> = {
  title: "Walkie/TranscriptionCard",
  component: TranscriptionCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    transcription: null,
    isProcessing: false,
    statusMessage: "",
  },
};

export default meta;
type Story = StoryObj<typeof TranscriptionCard>;

export const Hidden: Story = {};

export const WithText: Story = {
  args: {
    transcription: "こんにちは、OpenCodeさん",
  },
};

export const ProcessingJapanese: Story = {
  args: {
    isProcessing: true,
    statusMessage: "音声認識中...",
  },
};

export const ProcessingEnglish: Story = {
  args: {
    isProcessing: true,
    statusMessage: "Transcribing audio...",
  },
};

export const LongText: Story = {
  args: {
    transcription:
      "これは非常に長いテキストです。OpenCode Walkie-Talkieを使用して、ゲームパッドとスマートフォンを組み合わせて、移動中にAIと会話することができます。",
  },
};
