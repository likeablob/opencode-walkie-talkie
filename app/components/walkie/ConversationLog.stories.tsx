import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Transaction } from "~/stores/appStore";

import { ConversationLog } from "./ConversationLog";

const transactions: Transaction[] = [
  {
    id: "tx-1",
    timestamp: new Date("2026-05-07T10:00:00"),
    type: "user",
    text: "こんにちは、今日の天気を教えてください",
  },
  {
    id: "tx-2",
    timestamp: new Date("2026-05-07T10:01:00"),
    type: "agent",
    text: "こんにちは！今日の天気は晴れで、気温は25度です。",
  },
  {
    id: "tx-3",
    timestamp: new Date("2026-05-07T10:02:00"),
    type: "user",
    text: "ありがとう、では外出する際の服装を提案してください",
  },
  {
    id: "tx-4",
    timestamp: new Date("2026-05-07T10:03:00"),
    type: "agent",
    text: "今日は晴れて暖かいので、軽い服装がおすすめです。Tシャツと薄手のパンツ、そしてサンダルが適しています。",
  },
];

const meta: Meta<typeof ConversationLog> = {
  title: "Walkie/ConversationLog",
  component: ConversationLog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    transactions,
    logDisplay: "latest",
    onClear: () => console.log("Clear"),
  },
};

export default meta;
type Story = StoryObj<typeof ConversationLog>;

export const LatestMode: Story = {};

export const FullMode: Story = {
  args: {
    logDisplay: "full",
  },
};

export const EmptyLog: Story = {
  args: {
    transactions: [],
    logDisplay: "full",
  },
};

export const ManyTransactions: Story = {
  args: {
    transactions: [
      ...transactions,
      {
        id: "tx-5",
        timestamp: new Date("2026-05-07T10:04:00"),
        type: "user",
        text: "そうですね、では夕食のレシピも提案してください",
      },
      {
        id: "tx-6",
        timestamp: new Date("2026-05-07T10:05:00"),
        type: "agent",
        text: "夕食には、簡単で健康的なサラダとパスタの組み合わせを提案します。トマト、ほうれん草、チーズを使ったシンプルなパスタは15分で作れます。",
      },
      {
        id: "tx-7",
        timestamp: new Date("2026-05-07T10:06:00"),
        type: "user",
        text: "それは良さそうです。作り方を教えてください",
      },
      {
        id: "tx-8",
        timestamp: new Date("2026-05-07T10:07:00"),
        type: "agent",
        text: "パスタを茹でて、トマトとほうれん草を炒め、チーズを加えて混ぜ合わせます。詳細な手順をお伝えします。",
      },
    ],
    logDisplay: "full",
  },
};
