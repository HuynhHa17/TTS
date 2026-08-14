"""
TTS App Configuration
"""
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)  # d:\TTS

# File paths
CV_FILE       = os.path.join(ROOT_DIR, "CVpv.xlsx")
OUTPUT_FILE   = os.path.join(ROOT_DIR, "File_lưu.xlsx")
DATA_DIR      = os.path.join(BASE_DIR, "data")
DB_PATH       = os.path.join(DATA_DIR, "tts_master_v2.db")

# Flask
SECRET_KEY    = "tts-secret-2025"
DEBUG         = True
PORT          = 5000

# Gemini
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# App info
APP_NAME      = "TTS Master Dashboard"
APP_VERSION   = "1.0.0"

# Ensure data dir exists
os.makedirs(DATA_DIR, exist_ok=True)
