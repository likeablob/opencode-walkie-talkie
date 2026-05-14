import type { Meta, StoryObj } from "@storybook/react-vite";

import { getPTTStatus, PTTButton } from "./PTTButton";

const t = (key: string) => key;

const meta: Meta<typeof PTTButton> = {
  title: "Walkie/PTTButton",
  component: PTTButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    isRecording: false,
    isPlaying: false,
    isAgentRunning: false,
    inputState: "idle",
    ...getPTTStatus(false, false, false, false, "idle", t),
    subText: t("holdToSpeak"),
    onPTTStart: () => console.log("PTT Start"),
    onPTTEnd: () => console.log("PTT End"),
  },
};

export default meta;
type Story = StoryObj<typeof PTTButton>;

export const Idle: Story = {};

export const Recording: Story = {
  args: {
    isRecording: true,
    inputState: "recording",
    ...getPTTStatus(true, false, false, false, "recording", t),
    subText: t("tapToStop"),
  },
};

export const Playing: Story = {
  args: {
    isPlaying: true,
    ...getPTTStatus(false, true, false, false, "idle", t),
    subText: "",
  },
};

export const AgentRunning: Story = {
  args: {
    isAgentRunning: true,
    inputState: "waiting",
    ...getPTTStatus(false, false, false, true, "waiting", t),
    subText: "",
  },
};

export const Confirming: Story = {
  args: {
    inputState: "confirming",
    ...getPTTStatus(false, false, false, false, "confirming", t),
    subText: t("holdToSpeak"),
  },
};

export const Loading: Story = {
  args: {
    ...getPTTStatus(false, false, true, false, "idle", t),
    subText: "",
  },
};

export const Sending: Story = {
  args: {
    inputState: "sending",
    ...getPTTStatus(false, false, false, false, "sending", t),
    subText: "",
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <PTTButton
        isRecording={false}
        isPlaying={false}
        isAgentRunning={false}
        inputState="idle"
        {...getPTTStatus(false, false, false, false, "idle", t)}
        subText="Hold to speak"
        onPTTStart={() => console.log("PTT Start")}
        onPTTEnd={() => console.log("PTT End")}
      />
      <PTTButton
        isRecording={true}
        isPlaying={false}
        isAgentRunning={false}
        inputState="recording"
        {...getPTTStatus(true, false, false, false, "recording", t)}
        subText="Tap to stop"
        onPTTStart={() => console.log("PTT Start")}
        onPTTEnd={() => console.log("PTT End")}
      />
      <PTTButton
        isRecording={false}
        isPlaying={true}
        isAgentRunning={false}
        inputState="idle"
        {...getPTTStatus(false, true, false, false, "idle", t)}
        subText=""
        onPTTStart={() => console.log("PTT Start")}
        onPTTEnd={() => console.log("PTT End")}
      />
      <PTTButton
        isRecording={false}
        isPlaying={false}
        isAgentRunning={true}
        inputState="waiting"
        {...getPTTStatus(false, false, false, true, "waiting", t)}
        subText=""
        onPTTStart={() => console.log("PTT Start")}
        onPTTEnd={() => console.log("PTT End")}
      />
    </div>
  ),
};
