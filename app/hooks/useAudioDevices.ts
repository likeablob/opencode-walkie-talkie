import { useCallback, useEffect, useState } from "react";

import { useAppStore } from "~/stores/appStore";

export function useAudioDevices() {
  const devices = useAppStore((s) => s.audioDevices);
  const setSelectedDeviceId = useAppStore((s) => s.setSelectedAudioDevice);
  const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const initDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setPermissionGranted(true);

        const inputs = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = inputs.filter((d) => d.kind === "audioinput");
        setDeviceList(audioInputs);

        const storedDeviceId = useAppStore.getState().audioDevices.selectedDeviceId;
        if (storedDeviceId && audioInputs.some((d) => d.deviceId === storedDeviceId)) {
          setSelectedDeviceId(storedDeviceId);
        } else if (audioInputs.length > 0) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error("[AudioDevices] Permission denied:", err);
        setPermissionGranted(false);
      }
    };

    initDevices();

    const handleDeviceChange = async () => {
      if (!permissionGranted) return;

      const inputs = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = inputs.filter((d) => d.kind === "audioinput");
      setDeviceList(audioInputs);

      const currentDeviceId = useAppStore.getState().audioDevices.selectedDeviceId;
      if (currentDeviceId && !audioInputs.some((d) => d.deviceId === currentDeviceId)) {
        setSelectedDeviceId(null);
      }
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [permissionGranted, setSelectedDeviceId]);

  const selectDevice = useCallback(
    (deviceId: string) => {
      setSelectedDeviceId(deviceId);
    },
    [setSelectedDeviceId],
  );

  return {
    devices: deviceList,
    selectedDeviceId: devices.selectedDeviceId,
    selectDevice,
    permissionGranted,
  };
}
