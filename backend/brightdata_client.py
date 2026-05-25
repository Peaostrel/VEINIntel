import re
import requests
from config import settings


class BrightDataClient:
    """
    Client for interacting with Bright Data APIs:
    - Web Scraper API (SERP) for structured Google search results without rate limits or captchas.
    - Web Unlocker Proxy for bypassing bot-detection on competitor target pages.
    """

    # Bright Data Scraper API endpoint for Google search
    SCRAPER_API_URL = "https://api.brightdata.com/request"
    SERP_ZONE = "serp"  # Default zone name for SERP product

    def __init__(self):
        self.api_key = settings.BRIGHTDATA_API_KEY
        self.serp_user = settings.BRIGHTDATA_SERP_USER
        self.serp_pass = settings.BRIGHTDATA_SERP_PASS
        self.unlocker_proxy = settings.BRIGHTDATA_UNLOCKER_PROXY

    def _has_serp_credentials(self) -> bool:
        """Returns True if any usable Bright Data SERP credential is configured."""
        return bool(self.api_key or (self.serp_user and self.serp_pass))

    def google_search(self, query: str, num_results: int = 10) -> dict:
        """
        Query Google search via Bright Data Scraper API using Bearer token (API Key).
        Falls back to proxy-based auth if separate user/pass credentials are provided.

        Returns a normalized dict with a 'results' list of snippets.
        Ref: https://docs.brightdata.com/scraping-automation/web-scraper-api/get-started
        """
        if not self._has_serp_credentials():
            raise ValueError("No Bright Data SERP credentials configured.")

        # --- Method 1: Scraper API via Bearer token (preferred, uses BRIGHTDATA_API_KEY) ---
        if self.api_key:
            return self._serp_via_scraper_api(query, num_results)

        # --- Method 2: SERP proxy (legacy user/pass credentials) ---
        return self._serp_via_proxy(query, num_results)

    def _serp_via_scraper_api(self, query: str, num_results: int) -> dict:
        """
        Use Bright Data's Scraper REST API with Bearer token authentication.
        This is the modern, recommended approach with structured JSON output.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "zone": self.SERP_ZONE,
            "url": f"https://www.google.com/search?q={requests.utils.quote(query)}&num={num_results}&brd_json=1",
            "format": "json",
        }

        try:
            response = requests.post(
                self.SCRAPER_API_URL,
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            raw = response.json()
            return self._normalize_serp_response(raw, query)
        except requests.exceptions.RequestException as e:
            print(f"[BrightDataClient] Scraper API search error: {e}")
            raise RuntimeError(f"Bright Data Scraper API request failed: {e}")

    def _serp_via_proxy(self, query: str, num_results: int) -> dict:
        """
        Legacy method: route a Google search request through the Bright Data SERP proxy.
        Used when only SERP user/pass credentials (not API key) are available.
        """
        proxy_url = f"http://{self.serp_user}:{self.serp_pass}@brd.superproxy.io:22225"
        proxies = {"http": proxy_url, "https": proxy_url}
        search_url = f"https://www.google.com/search?q={requests.utils.quote(query)}&num={num_results}&brd_json=1"

        try:
            response = requests.get(
                search_url,
                proxies=proxies,
                verify=False,
                timeout=20
            )
            response.raise_for_status()
            raw = response.json()
            return self._normalize_serp_response(raw, query)
        except requests.exceptions.RequestException as e:
            print(f"[BrightDataClient] SERP proxy search error: {e}")
            raise RuntimeError(f"SERP proxy request failed: {e}")

    def _normalize_serp_response(self, raw: dict, query: str) -> dict:
        """
        Normalize Bright Data SERP JSON response into a clean, consistent structure.
        Handles both brd_json=1 format and fallback HTML extraction.
        """
        results = []

        # Extract from structured 'organic' field (brd_json=1 output)
        organic = raw.get("organic", [])
        for item in organic[:8]:
            results.append({
                "title": item.get("title", ""),
                "url": item.get("link", item.get("url", "")),
                "snippet": item.get("description", item.get("snippet", "")),
            })

        # If response came back as a list directly
        if not results and isinstance(raw, list):
            for item in raw[:8]:
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("link", item.get("url", "")),
                    "snippet": item.get("description", item.get("snippet", "")),
                })

        return {"query": query, "results": results, "total": len(results)}

    def fetch_url_html(self, target_url: str) -> str:
        """
        Fetch clean HTML from a target URL via Bright Data Web Unlocker proxy.
        Automatically bypasses Cloudflare, Akamai, and CAPTCHA challenges.
        """
        if self.api_key and not self.unlocker_proxy:
            # Use Scraper API for page fetching when only API key is present
            return self._fetch_via_scraper_api(target_url)

        if not self.unlocker_proxy:
            raise ValueError("Bright Data Web Unlocker proxy endpoint is not configured.")

        proxies = {
            "http": self.unlocker_proxy,
            "https": self.unlocker_proxy,
        }
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        }

        try:
            response = requests.get(
                target_url,
                headers=headers,
                proxies=proxies,
                verify=False,
                timeout=25
            )
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            print(f"[BrightDataClient] Web Unlocker error for {target_url}: {e}")
            raise RuntimeError(f"Web Unlocker fetch failed: {e}")

    def _fetch_via_scraper_api(self, target_url: str) -> str:
        """
        Alternative: fetch a full page using the Scraper API (Bearer token auth).
        Returns raw HTML text of the target page.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "zone": "unlocker",
            "url": target_url,
            "format": "raw",
        }

        try:
            response = requests.post(
                self.SCRAPER_API_URL,
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            print(f"[BrightDataClient] Scraper API page fetch error: {e}")
            raise RuntimeError(f"Scraper API page fetch failed: {e}")

    def test_connections(self) -> dict:
        """
        Validates credential presence and sandbox status for the health endpoint.
        """
        return {
            "api_key_configured": bool(self.api_key),
            "serp_proxy_configured": bool(self.serp_user and self.serp_pass),
            "unlocker_configured": bool(self.unlocker_proxy),
            "sandbox_active": settings.is_sandbox_mode(),
        }
