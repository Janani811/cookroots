import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

export function VoiceRecorderButton({
  language,
  onTranscribed,
}: {
  language?: string;
  onTranscribed: (text: string) => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  async function handlePress() {
    if (recording) {
      setRecording(false);
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;

      setTranscribing(true);
      try {
        const { text } = await api.transcribeAudio(
          { uri, name: "recording.m4a", type: "audio/m4a" },
          language
        );
        onTranscribed(text);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to transcribe audio");
      } finally {
        setTranscribing(false);
      }
      return;
    }

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      alert("Microphone permission is required to record audio.");
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
  }

  return (
    <Button className="mt-4" variant="danger" onPress={handlePress} loading={transcribing}>
      {transcribing ? "Transcribing..." : recording ? "⏹ Stop recording" : "🎙️ Record Audio"}
    </Button>
  );
}
