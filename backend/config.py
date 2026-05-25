import os
from pathlib import Path
from dotenv import load_dotenv

# Locate and load the .env file in the backend folder
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

class Config:
    """Application configuration loaded from environment variables."""
    
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    BRIGHTDATA_API_KEY = os.getenv("BRIGHTDATA_API_KEY", "")
    BRIGHTDATA_SERP_ZONE = os.getenv("BRIGHTDATA_SERP_ZONE", "")
    BRIGHTDATA_SERP_USER = os.getenv("BRIGHTDATA_SERP_USER", "")
    BRIGHTDATA_SERP_PASS = os.getenv("BRIGHTDATA_SERP_PASS", "")
    BRIGHTDATA_UNLOCKER_PROXY = os.getenv("BRIGHTDATA_UNLOCKER_PROXY", "")
    
    PORT = int(os.getenv("PORT", "8000"))
    HOST = os.getenv("HOST", "127.0.0.1")
    DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    @classmethod
    def is_sandbox_mode(cls) -> bool:
        """
        Determines if the application should run in sandbox/simulation mode.
        If no AI keys or Bright Data credentials are provided, we fallback to a beautiful
        simulated crawler to ensure seamless demo capability for judges and local testing.
        """
        has_ai = bool(cls.OPENAI_API_KEY or cls.GEMINI_API_KEY)
        has_bd = bool(cls.BRIGHTDATA_API_KEY or (cls.BRIGHTDATA_SERP_USER and cls.BRIGHTDATA_SERP_PASS))
        return not (has_ai and has_bd)

# Instantiate config
settings = Config()
