import type { Language } from "~/lib/i18n";
import type { AutoMessageSettings, GamepadConfig, ModelInfo } from "~/stores/appStore";

import { useState } from "react";
import { Check, Gamepad2, Globe, MessageSquarePlus, Mic, RefreshCw, Settings } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "~/components/ui/sidebar";
import { Switch } from "~/components/ui/switch";
import { getLocalizedText } from "~/lib/i18n";
import { cn } from "~/lib/utils";

import { AudioDeviceSelector } from "./AudioDeviceSelector";
import { ButtonMapper } from "./ButtonMapper";

export type SettingsDialogProps = {
  language: Language;
  availableModels: ModelInfo[];
  filteredModelIds: string[];
  gamepadConfig: GamepadConfig;
  gamepadConnected: boolean;
  gamepadButtons: boolean[];
  audioDevices: MediaDeviceInfo[];
  selectedMicDeviceId: string | null;
  audioPermissionGranted: boolean;
  autoMessageSettings: AutoMessageSettings;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onLanguageChange: (lang: Language) => void;
  onModelFilterToggle: (modelId: string) => void;
  onGamepadConfigChange: (config: GamepadConfig) => void;
  onMicDeviceChange: (deviceId: string) => void;
  onAutoMessageSettingsChange: (settings: AutoMessageSettings) => void;
};

export function SettingsDialog({
  language,
  availableModels,
  filteredModelIds,
  gamepadConfig,
  gamepadConnected,
  gamepadButtons,
  audioDevices,
  selectedMicDeviceId,
  audioPermissionGranted,
  autoMessageSettings,
  open,
  defaultOpen = false,
  onOpenChange,
  onLanguageChange,
  onModelFilterToggle,
  onGamepadConfigChange,
  onMicDeviceChange,
  onAutoMessageSettingsChange,
}: SettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<"general" | "models" | "gamepad">("general");

  const controlledOpen = open ?? isOpen;
  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={controlledOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="bg-card border-border hover:bg-accent rounded border p-2 text-center transition-all">
          <Settings className="mx-auto h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="flex h-[85dvh] flex-col overflow-hidden p-0 sm:max-w-[calc(100%-2rem)] md:h-[600px] md:max-w-[800px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">Customize your settings here.</DialogDescription>
        <SidebarProvider defaultOpen={true} className="h-full min-h-0 items-start">
          <Sidebar collapsible="none" className="border-border flex w-[60px] border-r md:w-[200px]">
            <SidebarContent className="flex flex-col items-stretch">
              <SidebarGroup>
                <SidebarGroupContent className="flex flex-col items-stretch">
                  <SidebarMenu className="flex flex-col items-stretch">
                    <SidebarMenuItem className="flex flex-col items-stretch">
                      <SidebarMenuButton
                        asChild
                        isActive={activeTab === "general"}
                        onClick={() => setActiveTab("general")}
                        className="w-full"
                      >
                        <button
                          className="flex w-full flex-col items-center justify-center gap-1 md:flex-row md:justify-start md:gap-2"
                          aria-label="General"
                        >
                          <Globe className="h-5 w-5 md:h-4 md:w-4" />
                          <span className="hidden text-xs md:inline">General</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem className="flex flex-col items-stretch">
                      <SidebarMenuButton
                        asChild
                        isActive={activeTab === "models"}
                        onClick={() => setActiveTab("models")}
                        className="w-full"
                      >
                        <button
                          className="flex w-full flex-col items-center justify-center gap-1 md:flex-row md:justify-start md:gap-2"
                          aria-label="Models"
                        >
                          <RefreshCw className="h-5 w-5 md:h-4 md:w-4" />
                          <span className="hidden text-xs md:inline">Models</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem className="flex flex-col items-stretch">
                      <SidebarMenuButton
                        asChild
                        isActive={activeTab === "gamepad"}
                        onClick={() => setActiveTab("gamepad")}
                        className="w-full"
                      >
                        <button
                          className="flex w-full flex-col items-center justify-center gap-1 md:flex-row md:justify-start md:gap-2"
                          aria-label="Gamepad"
                        >
                          <Gamepad2 className="h-5 w-5 md:h-4 md:w-4" />
                          <span className="hidden text-xs md:inline">Gamepad</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-full min-h-0 flex-1 flex-col">
            <header className="border-border flex shrink-0 items-center justify-between border-b px-4 py-3">
              <div className="text-sm font-medium">
                {activeTab === "general"
                  ? "General"
                  : activeTab === "models"
                    ? "Models"
                    : "Gamepad"}
              </div>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
              {activeTab === "general" && (
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <label className="text-sm font-medium">Language</label>
                    </div>
                    <Select
                      value={language}
                      onValueChange={(value) => onLanguageChange(value as Language)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ja">日本語</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      <label className="text-sm font-medium">Microphone</label>
                    </div>
                    <AudioDeviceSelector
                      devices={audioDevices}
                      selectedDeviceId={selectedMicDeviceId}
                      permissionGranted={audioPermissionGranted}
                      onDeviceChange={onMicDeviceChange}
                    />
                  </div>

                  <div className="border-border border-t pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <MessageSquarePlus className="h-4 w-4" />
                      <label className="text-sm font-medium">
                        {getLocalizedText("settingsAutoMessageTitle", language)}
                      </label>
                    </div>
                    <div className="mb-3 flex items-center gap-2">
                      <Switch
                        checked={autoMessageSettings.enabled}
                        onCheckedChange={(checked) =>
                          onAutoMessageSettingsChange({
                            ...autoMessageSettings,
                            enabled: checked,
                          })
                        }
                      />
                      <label className="text-sm">
                        {getLocalizedText("settingsAutoMessageEnable", language)}
                      </label>
                    </div>
                    {autoMessageSettings.enabled && (
                      <div>
                        <label className="text-muted-foreground mb-1 block text-xs">
                          {language === "ja"
                            ? getLocalizedText("settingsAutoMessageTextJa", language)
                            : getLocalizedText("settingsAutoMessageTextEn", language)}
                        </label>
                        <Input
                          value={
                            language === "ja"
                              ? autoMessageSettings.textJa
                              : autoMessageSettings.textEn
                          }
                          onChange={(e) =>
                            onAutoMessageSettingsChange({
                              ...autoMessageSettings,
                              [language === "ja" ? "textJa" : "textEn"]: e.target.value,
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "models" && (
                <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden">
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="mb-2 flex shrink-0 items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      <span className="font-medium">Model Filter</span>
                    </div>
                    <div className="text-muted-foreground mb-2 shrink-0 text-xs">
                      {filteredModelIds.length > 0
                        ? `${filteredModelIds.length} models selected`
                        : "All models shown (click to filter)"}
                    </div>
                    <div className="min-h-0 flex-1 space-y-1 overflow-y-scroll pr-2">
                      {availableModels.map((model) => (
                        <button
                          key={model.modelId}
                          onClick={() => onModelFilterToggle(model.modelId)}
                          className={cn(
                            "w-full rounded border p-2 text-left text-xs transition-all",
                            filteredModelIds.includes(model.modelId)
                              ? "bg-primary/10 border-primary"
                              : "bg-card border-border hover:bg-accent",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Check
                              className={cn(
                                "h-3 w-3",
                                filteredModelIds.includes(model.modelId)
                                  ? "text-primary"
                                  : "text-muted-foreground opacity-30",
                              )}
                            />
                            <span className="truncate">{model.modelId}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "gamepad" && (
                <div className="space-y-4">
                  <ButtonMapper
                    config={gamepadConfig}
                    gamepadConnected={gamepadConnected}
                    gamepadButtons={gamepadButtons}
                    onConfigChange={onGamepadConfigChange}
                  />
                </div>
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
