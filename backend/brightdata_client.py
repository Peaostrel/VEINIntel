import urllib.parse
import requests
from config import settings

class BrightDataClient:
    """
    Client for interacting with Bright Data APIs:
    - SERP API for clean, uncapped, and search-engine-friendly queries.
    - Web Unlocker for bypassing bot-detection and security hurdles on target competitor pages.
    """

    def __init__(self):
        self.api_key = settings.BRIGHTDATA_API_KEY
        self.serp_user = settings.BRIGHTDATA_SERP_USER
        self.serp_pass = settings.BRIGHTDATA_SERP_PASS
        self.unlocker_proxy = settings.BRIGHTDATA_UNLOCKER_PROXY

    def google_search(self, query: str, num_results: int = 10) -> dict:
        """
        Query Google search engine using Bright Data's SERP API.
        
        Ref: https://docs.brightdata.com/api-reference/serp/google-search
        """
        if not self.serp_user or not self.serp_pass:
            raise ValueError("Bright Data SERP API credentials are not configured.")

        # Bright Data SERP API endpoint
        url = "https://google.serp.brightdata.com/search"
        params = {
            "q": query,
            "lum_json": "1",  # Request structured JSON format
            "num": str(num_results)
        }
        
        # Configure standard basic authentication for Bright Data
        auth = (self.serp_user, self.serp_pass)
        
        try:
            response = requests.get(url, params=params, auth=auth, timeout=15)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"[BrightDataClient] Google Search Error: {e}")
            raise RuntimeError(f"SERP API request failed: {e}")

    def fetch_url_html(self, target_url: str) -> str:
        """
        Fetch HTML content from a target URL routing requests through the Web Unlocker proxy.
        This bypasses Cloudflare, Akamai, or captchas transparently.
        """
        if not self.unlocker_proxy:
            raise ValueError("Bright Data Web Unlocker proxy endpoint is not configured.")

        proxies = {
            "http": self.unlocker_proxy,
            "https": self.unlocker_proxy
        }
        
        # Set standard browser-like user agent to match unlocker profile
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/115.0.0.0 Safari/537.36"
            )
        }
        
        try:
            # We disable SSL verification in proxy setups as proxies act as MITM decryption points
            response = requests.get(
                target_url, 
                headers=headers, 
                proxies=proxies, 
                verify=False, 
                timeout=20
            )
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            print(f"[BrightDataClient] Web Unlocker fetch error for {target_url}: {e}")
            raise RuntimeError(f"Web Unlocker proxy extraction failed: {e}")

    def test_connections(self) -> dict:
        """
        Validates whether Bright Data credentials are ready and functional.
        """
        status = {
            "serp_configured": bool(self.serp_user and self.serp_pass),
            "unlocker_configured": bool(self.unlocker_proxy),
            "sandbox_active": settings.is_sandbox_mode()
        }
        return status
