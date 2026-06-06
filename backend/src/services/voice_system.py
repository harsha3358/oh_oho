import queue
import threading
import numpy as np

# We wrap the imports in try-except so the backend doesn't crash 
# if native audio libraries fail to load in certain Windows environments without C++ tools.
try:
    import sounddevice as sd
    import openwakeword
    from openwakeword.model import Model
    from faster_whisper import WhisperModel
    VOICE_AVAILABLE = True
except ImportError as e:
    print(f"Voice libraries not fully installed. CPU fallback active. Error: {e}")
    VOICE_AVAILABLE = False

class VoiceSystem:
    def __init__(self):
        self.is_listening = False
        self.audio_queue = queue.Queue()
        self.wake_word_model = None
        self.stt_model = None
        
    def initialize(self):
        if not VOICE_AVAILABLE:
            return False
            
        print("Initializing Voice Models...")
        # OpenWakeWord (using default pre-trained models for 'alexa' or 'hey mycroft' 
        # since custom 'Oh Oh' requires training a custom ONNX model)
        # For Sprint 1, we simulate "Oh Oh" detection
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
        print("JARVIS is now listening...")

    def _process_audio(self):
        while self.is_listening:
            audio_chunk = self.audio_queue.get()
            # Convert bytes to numpy array
            audio_np = np.frombuffer(audio_chunk, dtype=np.int16)
            
            # Feed to wake word model
            prediction = self.wake_word_model.predict(audio_np)
            
            # Check scores
            for mdl in self.wake_word_model.prediction_buffer.keys():
                score = self.wake_word_model.prediction_buffer[mdl][-1]
                if score > 0.5:
                    print("WAKE WORD DETECTED: 'Oh Oh' (Mocked via hey_jarvis)")
                    # Trigger Whisper transcription here...
                    # self.transcribe_command()
                    
    def stop_listening(self):
        self.is_listening = False
        if hasattr(self, 'stream'):
            self.stream.stop()
            self.stream.close()

voice_system = VoiceSystem()
