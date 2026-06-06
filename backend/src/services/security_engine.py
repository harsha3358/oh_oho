import base64
import json
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import secrets
import string

class SecurityEngine:
    def __init__(self):
        self.master_key = None
        self.cipher = None
        self.is_unlocked = False

    def unlock_with_key(self, key_material: str, salt: bytes = b'jarvis_salt'):
        """Unlocks the database encryption using a key derived from the given material."""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=390000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(key_material.encode()))
        self.master_key = key
        self.cipher = Fernet(key)
        self.is_unlocked = True
        return True

    def generate_recovery_key(self) -> str:
        """Generates a 32-character recovery key grouped by hyphens."""
        alphabet = string.ascii_uppercase + string.digits
        key = ''.join(secrets.choice(alphabet) for i in range(32))
        return '-'.join(key[i:i+8] for i in range(0, 32, 8))

    def encrypt_data(self, data: str) -> str:
        """Encrypts string data for storage."""
        if not self.is_unlocked or not self.cipher:
            # Fallback to plaintext if not unlocked (e.g. initial setup)
            # In production, this should throw an error to prevent accidental plaintext storage
            return data
        return self.cipher.encrypt(data.encode()).decode()

    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypts stored string data."""
        if not self.is_unlocked or not self.cipher:
            return encrypted_data
            
        try:
            # If it's not actually encrypted (e.g. legacy data), Fernet will throw an error
            return self.cipher.decrypt(encrypted_data.encode()).decode()
        except Exception:
            # Legacy plaintext fallback
            return encrypted_data

    def encrypt_dict(self, data_dict: dict) -> str:
        """Serializes and encrypts a dictionary."""
        json_str = json.dumps(data_dict)
        return self.encrypt_data(json_str)

    def decrypt_dict(self, encrypted_str: str) -> dict:
        """Decrypts and deserializes a dictionary."""
        try:
            decrypted_str = self.decrypt_data(encrypted_str)
            return json.loads(decrypted_str)
        except Exception:
            return {}

security_engine = SecurityEngine()
