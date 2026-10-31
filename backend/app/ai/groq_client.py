import json
import re
from typing import Optional, Dict, Any, List
import groq
from app.core.config import settings
from app.core.logging import logger


class AIConfigurationError(Exception):
    """Raised when Groq API key is missing or model configuration is invalid."""
    pass


class AIProcessingError(Exception):
    """Raised when Groq API processing or parsing fails after retries."""
    pass


def clean_json_response(raw_text: str) -> str:
    """Strip markdown code blocks and whitespace to obtain pure JSON."""
    cleaned = raw_text.strip()
    # Remove ```json ... ``` or ``` ... ```
    if cleaned.startswith("```"):
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if match:
            cleaned = match.group(1).strip()
    return cleaned


class GroqClientService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.preferred_model = settings.GROQ_MODEL
        self.fallback_models = settings.GROQ_FALLBACK_MODELS
        self._client: Optional[groq.Groq] = None
        self._initialize_client()

    def _initialize_client(self):
        if self.api_key and self.api_key.strip():
            try:
                self._client = groq.Groq(api_key=self.api_key.strip(), timeout=30.0)
                logger.info(f"Groq client initialized with preferred model: {self.preferred_model}")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                self._client = None
        else:
            logger.warning(
                "GROQ_API_KEY is not configured. AI features will require API key setup."
            )
            self._client = None

    def is_configured(self) -> bool:
        return self._client is not None and bool(self.api_key and self.api_key.strip())

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_configured": self.is_configured(),
            "model": self.preferred_model,
            "has_api_key": bool(self.api_key and self.api_key.strip()),
            "message": "Groq AI is ready" if self.is_configured() else "GROQ_API_KEY is not configured. Set GROQ_API_KEY in environment or .env file to enable live AI workflows."
        }

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 4096
    ) -> Dict[str, Any]:
        """
        Call Groq with JSON response mode, handling model fallbacks and schema parsing.
        """
        if not self.is_configured():
            raise AIConfigurationError(
                "Groq API key is not configured. Please supply a valid GROQ_API_KEY in the environment or .env file."
            )

        models_to_try = [self.preferred_model] + [
            m for m in self.fallback_models if m != self.preferred_model
        ]
        
        last_error = None
        for model in models_to_try:
            for attempt in range(2):  # Max 2 attempts per model
                try:
                    logger.info(f"Calling Groq model '{model}' (attempt {attempt + 1})...")
                    chat_completion = self._client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        response_format={"type": "json_object"},
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                    raw_content = chat_completion.choices[0].message.content
                    if not raw_content:
                        raise ValueError("Received empty response content from Groq.")
                    
                    cleaned_content = clean_json_response(raw_content)
                    parsed_json = json.loads(cleaned_content)
                    logger.info(f"Successfully received and parsed JSON from Groq model '{model}'.")
                    return parsed_json

                except json.JSONDecodeError as jde:
                    logger.warning(f"JSON decode failed on attempt {attempt + 1} with {model}: {jde}")
                    last_error = jde
                except groq.NotFoundError as nfe:
                    logger.warning(f"Groq model '{model}' not found or unsupported: {nfe}. Trying fallback model.")
                    last_error = nfe
                    break  # Move to next model
                except groq.RateLimitError as rle:
                    logger.warning(f"Groq RateLimit on '{model}': {rle}")
                    last_error = rle
                    break
                except Exception as e:
                    logger.warning(f"Groq invocation error on attempt {attempt + 1} with {model}: {e}")
                    last_error = e

        raise AIProcessingError(
            f"AI processing failed across available Groq models. Last error: {str(last_error)}"
        )


groq_service = GroqClientService()
