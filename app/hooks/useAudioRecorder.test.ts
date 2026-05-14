import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAudioRecorder } from "./useAudioRecorder";

type MockMediaRecorderInstance = {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  stream: MediaStream;
  ondataavailable: ((event: BlobEvent) => void) | null;
  onstop: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  state: string;
  mimeType: string;
};

describe("useAudioRecorder", () => {
  let mediaRecorderInstances: MockMediaRecorderInstance[];

  beforeEach(() => {
    vi.useFakeTimers();
    mediaRecorderInstances = [];

    const MockMediaRecorder = vi.fn(function (
      this: MockMediaRecorderInstance,
      stream: MediaStream,
    ) {
      this.stream = stream;
      this.start = vi.fn();
      this.stop = vi.fn();
      this.ondataavailable = null;
      this.onstop = null;
      this.onerror = null;
      this.state = "inactive";
      this.mimeType = "audio/webm;codecs=opus";
      mediaRecorderInstances.push(this);
      return this;
    });

    vi.stubGlobal("MediaRecorder", MockMediaRecorder);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe("race condition handling", () => {
    it("should abort recording when stopped during getUserMedia (starting state)", async () => {
      const mockTrack = {
        stop: vi.fn(),
        kind: "audio",
      } as unknown as MediaStreamTrack;

      const mockStream = {
        getTracks: vi.fn(() => [mockTrack]),
        getAudioTracks: vi.fn(() => [mockTrack]),
      } as unknown as MediaStream;

      let resolveGetUserMedia: (stream: MediaStream) => void;
      const mockGetUserMedia = vi.fn().mockImplementation(
        () =>
          new Promise<MediaStream>((resolve) => {
            resolveGetUserMedia = resolve;
          }),
      );

      vi.stubGlobal("navigator", {
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
      });

      const { result } = renderHook(() => useAudioRecorder());

      act(() => {
        result.current.startRecording();
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.state).toBe("starting");
      expect(result.current.isRecording).toBe(true);

      act(() => {
        result.current.stopRecording();
      });

      expect(result.current.state).toBe("idle");
      expect(result.current.isRecording).toBe(false);

      await act(async () => {
        resolveGetUserMedia(mockStream);
        await vi.runAllTimersAsync();
      });

      expect(result.current.state).toBe("idle");
      expect(mockTrack.stop).toHaveBeenCalled();
      expect(mediaRecorderInstances.length).toBe(0);
    });

    it("should handle stop after getUserMedia completes (recording state)", async () => {
      const mockTrack = {
        stop: vi.fn(),
        kind: "audio",
      } as unknown as MediaStreamTrack;

      const mockStream = {
        getTracks: vi.fn(() => [mockTrack]),
        getAudioTracks: vi.fn(() => [mockTrack]),
      } as unknown as MediaStream;

      const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

      vi.stubGlobal("navigator", {
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
      });

      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        result.current.startRecording();
        await vi.runAllTimersAsync();
      });

      expect(result.current.state).toBe("recording");
      const instance = mediaRecorderInstances[0];
      expect(instance?.start).toHaveBeenCalledWith(100);

      await act(async () => {
        result.current.stopRecording();
      });

      expect(instance?.stop).toHaveBeenCalled();

      const mockBlob = new Blob(["test audio"], { type: "audio/webm" });
      await act(async () => {
        if (instance?.ondataavailable) {
          instance.ondataavailable({ data: mockBlob } as BlobEvent);
        }
        if (instance?.onstop) {
          instance.onstop();
        }
        await vi.runAllTimersAsync();
      });

      expect(result.current.state).toBe("idle");
      expect(result.current.audioBlob).toStrictEqual(mockBlob);
    });
  });

  describe("normal operation", () => {
    it("should start recording successfully", async () => {
      const mockTrack = {
        stop: vi.fn(),
        kind: "audio",
      } as unknown as MediaStreamTrack;

      const mockStream = {
        getTracks: vi.fn(() => [mockTrack]),
        getAudioTracks: vi.fn(() => [mockTrack]),
      } as unknown as MediaStream;

      const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

      vi.stubGlobal("navigator", {
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
      });

      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        result.current.startRecording();
        await vi.runAllTimersAsync();
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: false,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      expect(result.current.state).toBe("recording");
      const instance = mediaRecorderInstances[0];
      expect(instance?.start).toHaveBeenCalledWith(100);
      expect(result.current.isRecording).toBe(true);
    });

    it("should stop recording and produce audio blob", async () => {
      const mockTrack = {
        stop: vi.fn(),
        kind: "audio",
      } as unknown as MediaStreamTrack;

      const mockStream = {
        getTracks: vi.fn(() => [mockTrack]),
        getAudioTracks: vi.fn(() => [mockTrack]),
      } as unknown as MediaStream;

      const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

      vi.stubGlobal("navigator", {
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
      });

      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        result.current.startRecording();
        await vi.runAllTimersAsync();
      });

      expect(result.current.state).toBe("recording");

      await act(async () => {
        result.current.stopRecording();
      });

      const instance = mediaRecorderInstances[0];
      expect(instance?.stop).toHaveBeenCalled();

      const mockBlob = new Blob(["test audio chunks"], { type: "audio/webm" });
      await act(async () => {
        if (instance?.ondataavailable) {
          instance.ondataavailable({ data: mockBlob } as BlobEvent);
        }
        if (instance?.onstop) {
          instance.onstop();
        }
        await vi.runAllTimersAsync();
      });

      expect(result.current.state).toBe("idle");
      expect(result.current.audioBlob).toStrictEqual(mockBlob);
      expect(result.current.isRecording).toBe(false);
      expect(mockTrack.stop).toHaveBeenCalled();
    });
  });

  describe("cancel recording", () => {
    it("should cancel during starting state", async () => {
      const mockTrack = {
        stop: vi.fn(),
        kind: "audio",
      } as unknown as MediaStreamTrack;

      const mockStream = {
        getTracks: vi.fn(() => [mockTrack]),
        getAudioTracks: vi.fn(() => [mockTrack]),
      } as unknown as MediaStream;

      let resolveGetUserMedia: (stream: MediaStream) => void;
      const mockGetUserMedia = vi.fn().mockImplementation(
        () =>
          new Promise<MediaStream>((resolve) => {
            resolveGetUserMedia = resolve;
          }),
      );

      vi.stubGlobal("navigator", {
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
      });

      const { result } = renderHook(() => useAudioRecorder());

      act(() => {
        result.current.startRecording();
      });

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.state).toBe("starting");

      act(() => {
        result.current.cancelRecording();
      });

      expect(result.current.state).toBe("idle");
      expect(result.current.audioBlob).toBeNull();

      await act(async () => {
        resolveGetUserMedia(mockStream);
        await vi.runAllTimersAsync();
      });

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(mediaRecorderInstances.length).toBe(0);
    });

    it("should cancel during recording state", async () => {
      const mockTrack = {
        stop: vi.fn(),
        kind: "audio",
      } as unknown as MediaStreamTrack;

      const mockStream = {
        getTracks: vi.fn(() => [mockTrack]),
        getAudioTracks: vi.fn(() => [mockTrack]),
      } as unknown as MediaStream;

      const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

      vi.stubGlobal("navigator", {
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
        },
      });

      const { result } = renderHook(() => useAudioRecorder());

      await act(async () => {
        result.current.startRecording();
        await vi.runAllTimersAsync();
      });

      expect(result.current.state).toBe("recording");

      await act(async () => {
        result.current.cancelRecording();
      });

      const instance = mediaRecorderInstances[0];
      expect(instance?.stop).toHaveBeenCalled();

      await act(async () => {
        if (instance?.onstop) {
          instance.onstop();
        }
        await vi.runAllTimersAsync();
      });

      expect(result.current.state).toBe("idle");
      expect(result.current.audioBlob).toBeNull();
    });
  });
});
