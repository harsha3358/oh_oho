import threading
from pynput import keyboard
from src.services.voice_system import voice_system

class InputHook:
    def __init__(self):
        self.alt_pressed = False
        self.space_pressed = False
        self.listener = None
        self.hotkey_mode = False # True if we are doing Alt+Space
    
    def start(self):
        self.listener = keyboard.Listener(
            on_press=self.on_press,
            on_release=self.on_release
        )
        self.listener.daemon = True
        self.listener.start()
        print("Global input hook started. Listening for Alt and Alt+Space.")

    def on_press(self, key):
        if key == keyboard.Key.alt_l or key == keyboard.Key.alt_r:
            if not self.alt_pressed:
                self.alt_pressed = True
                self.hotkey_mode = False
                # Delay the PTT start slightly to see if space is pressed
                threading.Timer(0.1, self.trigger_ptt_if_not_hotkey).start()
                
        if key == keyboard.Key.space:
            self.space_pressed = True
            if self.alt_pressed:
                self.hotkey_mode = True
                print("Global Hotkey Detected: ALT+SPACE")
                voice_system.trigger_manual_activation(mode='hotkey')

    def trigger_ptt_if_not_hotkey(self):
        if self.alt_pressed and not self.hotkey_mode:
            print("Push-To-Talk Triggered: Hold ALT")
            voice_system.trigger_manual_activation(mode='ptt')

    def on_release(self, key):
        if key == keyboard.Key.alt_l or key == keyboard.Key.alt_r:
            self.alt_pressed = False
            if not self.hotkey_mode:
                print("Push-To-Talk Released")
                voice_system.stop_manual_activation()
            self.hotkey_mode = False
            
        if key == keyboard.Key.space:
            self.space_pressed = False

input_hook = InputHook()
