import queue
import threading
import numpy as np
import asyncio
import urllib.request
import json
from src.services.desktop_engine import desktop_engine

try:
    import sounddevice as sd
    import openwakeword
    from openwakeword.model import Model
    from faster_whisper import WhisperModel
    VOICE_AVAILABLE = True
except ImportError as e:
    print(f"Voice libraries not fully installed. CPU fallback active. Error: {e}")
    VOICE_AVAILABLE = False

def check_internet():
    try:
        urllib.request.urlopen('http://8.8.8.8', timeout=1)
        return True
    except:
        return False

class VoiceSystem:
    def __init__(self):
        self.is_listening = False
        self.audio_queue = queue.Queue()
        self.wake_word_model = None
        self.stt_model = None
        self.manager = None
        self.loop = None
        
    def initialize(self, manager=None):
        if not VOICE_AVAILABLE:
            return False
            
        print("Initializing Voice Models...")
        self.manager = manager
        try:
            self.loop = asyncio.get_running_loop()
        except RuntimeError:
            self.loop = None
        
        try:
            openwakeword.utils.download_models()
            self.wake_word_model = Model(wakeword_models=["hey_jarvis"], inference_framework="onnx")
            
            # Faster Whisper (CPU fallback for Sprint 1, tiny.en for speed)
            self.stt_model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
            return True
        except Exception as e:
            print(f"Failed to load voice models: {e}")
            return False

    def audio_callback(self, indata, frames, time, status):
        """This is called for each audio block by sounddevice."""
        if status:
            print(status)
        self.audio_queue.put(bytes(indata))

    def start_listening(self):
        if not VOICE_AVAILABLE or not self.wake_word_model:
            print("Cannot start listening: Voice unavailable.")
            return

        self.is_listening = True
        # Create an input stream (16kHz, mono) which is standard for wake word and whisper
        self.stream = sd.RawInputStream(
            samplerate=16000, 
            blocksize=1280, 
            dtype='int16',
            channels=1, 
            callback=self.audio_callback
        )
        self.stream.start()
        
        # Start a background thread to process the audio stream
        self.process_thread = threading.Thread(target=self._process_audio)
        self.process_thread.daemon = True
        self.process_thread.start()
        print("Harsha's Assistant is now listening for 'Oye'...")

    def _process_audio(self):
        while self.is_listening:
            audio_chunk = self.audio_queue.get()
            audio_np = np.frombuffer(audio_chunk, dtype=np.int16)
            
            prediction = self.wake_word_model.predict(audio_np)
            
            for mdl in self.wake_word_model.prediction_buffer.keys():
                score = self.wake_word_model.prediction_buffer[mdl][-1]
                if score > 0.5:
                    if desktop_engine.is_in_meeting():
                        print("Oye Detected, but SMART MEETING MODE is active. Ignoring wake word.")
                    else:
                        print("Oye Detected (Mocked via hey_jarvis)")
                        if self.manager and self.loop:
                            msg = json.dumps({"type": "state_change", "state": "listening"})
                            asyncio.run_coroutine_threadsafe(self.manager.broadcast(msg), self.loop)
                        
                        self._handle_voice_input()
                    # Clear buffer to avoid re-triggering immediately
                    self.wake_word_model.reset()

    def _handle_voice_input(self):
        print("Processing voice command...")
        if not check_internet():
            print("Internet is down. Falling back to Offline Mode (faster_whisper + local rules).")
            # In a real scenario we would capture the next few seconds of audio here
            # and pass to self.stt_model.transcribe(audio_file)
            # local_response = local_rules_engine(transcription)
        else:
            print("Internet is up. Using Online Services.")
            # Normal cloud transcription / LLM
            
    def stop_listening(self):
        self.is_listening = False
        if hasattr(self, 'stream'):
            self.stream.stop()
            self.stream.close()

voice_system = VoiceSystem()

