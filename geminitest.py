import os
from dotenv import load_dotenv
from google import genai
load_dotenv()  # Load environment variables from .env file
key = os.getenv("GEMINI_API_KEY")
print(key is not None)    # True = found. Never print the key itself.
client = genai.Client(api_key=key)
response = client.models.generate_content(
    model="gemini-3.8-flash",
    contents = "say hello in malay",
    )
print(response.text)