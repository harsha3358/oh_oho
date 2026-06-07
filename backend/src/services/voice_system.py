import queue
import threading
import numpy as np
import asyncio
import urllib.request
import json
import os
import tempfile
import scipy.io.wavfile as wav
import time
from src.services.desktop_engine import desktop_engine
from src.agents.orchestrator import orchestrator

try:
    import sounddevice as sd
    from faster_whisper import WhisperModel
    import edge_tts
    import pygame
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
        
        self.state = 'CAPTURING' # CAPTURING, THINKING, SPEAKING
        self.listening_mode = 'continuous' # 'wake_word', 'continuous', 'ptt'
        self.audio_buffer = []
        self.silence_frames = 0
        self.MAX_SILENCE_FRAMES = 40 # 3.2s of silence (Increased patience)
        self.RMS_THRESHOLD = 500
        
        if VOICE_AVAILABLE:
            pygame.mixer.init()

    def initialize(self, manager=None):
        if not VOICE_AVAILABLE: return False
        print("Initializing Advanced Voice Models...")
        self.manager = manager
        try:
            self.loop = asyncio.get_running_loop()
        except RuntimeError:
            self.loop = None
            
        try:
            self.stt_model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
            return True
        except Exception as e:
            print(f"Failed to load voice models: {e}")
            return False

    def audio_callback(self, indata, frames, time, status):
        self.audio_queue.put(bytes(indata))

    def start_listening(self):
        if not VOICE_AVAILABLE: return
        self.is_listening = True
        self.stream = sd.RawInputStream(
            samplerate=16000, blocksize=1280, dtype='int16', channels=1, callback=self.audio_callback
        )
        self.stream.start()
        
        self.process_thread = threading.Thread(target=self._process_audio)
        self.process_thread.daemon = True
        self.process_thread.start()
        print("JARVIS Full Duplex Voice Engine Started.")

    def set_listening_mode(self, mode):
        print(f"Setting Listening Mode: {mode}")
        self.listening_mode = mode

    def trigger_manual_activation(self, mode='hotkey'):
        if self.state == 'CAPTURING': return
        
        print(f"Manual Activation Triggered: {mode}")
        self._interrupt_tts()
        
        if mode == 'ptt':
            self.state = 'CAPTURING_PTT'
        else:
            self.state = 'CAPTURING_VAD'
            self.silence_frames = 0
        
        self.audio_buffer = []
        self._broadcast_state("listening")

    def stop_manual_activation(self):
        # PTT Released
        self._process_audio_buffer()

    def _interrupt_tts(self):
        if pygame.mixer.music.get_busy():
            print("Interrupting TTS!")
            pygame.mixer.music.stop()
        if self.manager and self.loop:
            msg = json.dumps({"type": "interrupt_tts"})
            asyncio.run_coroutine_threadsafe(self.manager.broadcast(msg), self.loop)

    def _broadcast_state(self, state):
        if self.manager and self.loop:
            msg = json.dumps({"type": "state_change", "state": state})
            asyncio.run_coroutine_threadsafe(self.manager.broadcast(msg), self.loop)

    def _process_audio(self):
        while self.is_listening:
            audio_chunk = self.audio_queue.get()
            audio_np = np.frombuffer(audio_chunk, dtype=np.int16)
            rms = np.sqrt(np.mean(np.square(audio_np.astype(np.float32))))
            
            if self.state == 'SPEAKING':
                if rms > (self.RMS_THRESHOLD * 1.5):
                    print("User interruption detected while speaking!")
                    self._interrupt_tts()
                    self.state = 'CAPTURING'
                    self.audio_buffer = [audio_np]
                    self.silence_frames = 0
                    self._broadcast_state("listening")
                    
            elif self.state == 'CAPTURING':
                self.audio_buffer.append(audio_np)
                
                if rms > self.RMS_THRESHOLD:
                    self.silence_frames = 0
                else:
                    self.silence_frames += 1
                    
                if self.silence_frames > self.MAX_SILENCE_FRAMES:
                    # Silence detected, process
                    if len(self.audio_buffer) > self.MAX_SILENCE_FRAMES + 10: 
                        # We captured actual audio beyond just silence
                        self._process_audio_buffer()
                    else:
                        # It was just empty noise, reset
                        self.audio_buffer = []
                        self.silence_frames = 0

    def _process_audio_buffer(self):
        if self.state != 'CAPTURING': return
        self.state = 'THINKING'
        self._broadcast_state("thinking")
        
        if len(self.audio_buffer) < 10:
            self._handle_end_of_turn()
            return
            
        full_audio = np.concatenate(self.audio_buffer)
        self.audio_buffer = []
        
        temp_dir = tempfile.gettempdir()
        temp_wav = os.path.join(temp_dir, "jarvis_command.wav")
        wav.write(temp_wav, 16000, full_audio)
        
        print("Transcribing with faster-whisper...")
        try:
            segments, info = self.stt_model.transcribe(temp_wav, beam_size=5)
            text = " ".join([segment.text for segment in segments]).strip()
            print(f"User: {text}")
            
            
            text_lower = text.lower().strip()
            
            # Send to UI transcript
            if self.loop and self.manager and text:
                import time, random
                transcript_msg = {
                    "type": "transcript_entry",
                    "entry": {
                        "id": str(random.randint(10000, 99999)),
                        "role": "user",
                        "text": text,
                        "timestamp": time.time() * 1000
                    }
                }
                asyncio.run_coroutine_threadsafe(self.manager.broadcast(json.dumps(transcript_msg)), self.loop)

            if text_lower in ["sleep.", "goodbye.", "stop listening.", "sleep", "goodbye"]:
                print("Explicit sleep command detected. Exiting continuous mode.")
                self.listening_mode = 'wake_word'
                self._broadcast_state("sleeping")
                self._handle_end_of_turn()
            elif text:
                is_wake_word = "oi" in text_lower or "oye" in text_lower or "jarvis" in text_lower
                
                if self.listening_mode == 'wake_word' and not is_wake_word:
                    print(f"Ignored (No wake word): {text}")
                    self._handle_end_of_turn()
                else:
                    if self.loop and self.manager:
                        asyncio.run_coroutine_threadsafe(self._invoke_orchestrator(text), self.loop)
            else:
                self._handle_end_of_turn()
        except Exception as e:
            print(f"Transcription failed: {e}")
            self._handle_end_of_turn()
            
        try: os.remove(temp_wav)
        except: pass

    async def _invoke_orchestrator(self, text):
        try:
            response = orchestrator.invoke({"messages": [{"role": "user", "content": text}]})
            ai_msg = response["messages"][-1]["content"]
            print(f"JARVIS: {ai_msg}")
            await self._speak_response(ai_msg)
        except Exception as e:
            print(f"Orchestrator failed: {e}")
            await self._speak_response("Sorry, my core encountered an error.")

    async def _speak_response(self, text):
        self.state = 'SPEAKING'
        self._broadcast_state("speaking")
        
        temp_dir = tempfile.gettempdir()
        mp3_path = os.path.join(temp_dir, "jarvis_response.mp3")
        
        try:
            communicate = edge_tts.Communicate(text, "en-IN-NeerjaNeural")
            await communicate.save(mp3_path)
            
            pygame.mixer.music.load(mp3_path)
            pygame.mixer.music.play()
            
            while pygame.mixer.music.get_busy() and self.state == 'SPEAKING':
                await asyncio.sleep(0.1)
                
            pygame.mixer.music.unload()
        except Exception as e:
            print(f"TTS Engine failed: {e}")
            
        try: os.remove(mp3_path)
        except: pass
        
        self._handle_end_of_turn()

    def _handle_end_of_turn(self):
        self.audio_buffer = [] # Flush buffer to clear any self-echo
        self.silence_frames = 0
        self.state = 'CAPTURING'
        self._broadcast_state("listening")

voice_system = VoiceSystem()
