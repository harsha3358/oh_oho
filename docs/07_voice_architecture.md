# Voice Architecture Design

## 1. Voice System Overview
Pipeline: `Microphone -> VAD (WebRTC) -> Wake Word (OpenWakeWord) -> STT (Faster-Whisper) -> LLM -> TTS (Kokoro) -> Speaker`
Target Latency: < 3 seconds from speech end to audio start.

## 2. Wake Word System
- **Wake Phrase**: "Oh Oh"
- **Tech**: OpenWakeWord (Python) running on a dedicated background thread.
- **Confirmation**: AI Core pulses visually, subtle chime plays.
- **Fallback**: Push-to-talk (Ctrl+Space).

## 3. Voice Activity Detection (VAD)
- **Tech**: `webrtcvad`. Aggressiveness level 2.
- **Trigger**: Starts buffering audio upon wake word. Stops recording after 1.5 seconds of silence.

## 4. Speech-to-Text
- **Tech**: `faster-whisper` (`base.en` model).
- **Execution**: Runs on CUDA if available, CPU int8 otherwise.
- **Confidence**: Re-prompts if confidence < 0.7.

## 5. Text-to-Speech
- **Tech**: `kokoro` TTS.
- **Voice**: Female Indian English voice (`af_heart` or similar profile).
- **Streaming**: Synthesizes and plays audio in chunks so playback starts before the full paragraph is generated.
- **Interruption**: If user says "Oh Oh" or hits push-to-talk while JARVIS is speaking, playback instantly halts.

## 6. Audio Pipeline Implementation
- Uses `sounddevice` and `numpy`. 16kHz for STT, 22kHz for TTS.
- Includes a bandpass filter to reduce background noise.

## 7. State Machine
- `SLEEPING`
- `WAKE_DETECTED`
- `RECORDING`
- `TRANSCRIBING`
- `THINKING`
- `SPEAKING`

## 8. Multi-language Support
- Indian English primarily, handling Hinglish naturally through the Whisper model.

## 9. Error Recovery
- If the microphone disconnects, gracefully fallback to text-only mode and notify the user.
