import { Mic } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export type AudioDeviceSelectorProps = {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
  permissionGranted: boolean;
  onDeviceChange: (deviceId: string) => void;
};

export function AudioDeviceSelector({
  devices = [],
  selectedDeviceId,
  permissionGranted,
  onDeviceChange,
}: AudioDeviceSelectorProps) {
  const getDeviceLabel = (device: MediaDeviceInfo, index: number) => {
    if (device.label) {
      return device.label;
    }
    return `Microphone ${index + 1}`;
  };

  const selectedDevice = devices.find((d) => d.deviceId === selectedDeviceId);
  const displayValue = selectedDevice
    ? getDeviceLabel(selectedDevice, devices.indexOf(selectedDevice))
    : devices.length > 0
      ? getDeviceLabel(devices[0], 0)
      : "Select Microphone";

  if (!permissionGranted) {
    return (
      <div className="text-muted-foreground text-xs">
        Microphone permission required. Start recording to grant permission.
      </div>
    );
  }

  return (
    <Select
      value={selectedDeviceId || (devices.length > 0 ? devices[0].deviceId : "")}
      onValueChange={onDeviceChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span className="truncate">{displayValue}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {devices.map((device, index) => (
          <SelectItem key={device.deviceId} value={device.deviceId}>
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span className="truncate">{getDeviceLabel(device, index)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
