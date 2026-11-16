from fastapi import FastAPI
from document_loader import load_documents
from pathlib import Path
import os
import httpx
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field, ConfigDict
from fastapi import HTTPException
from google.genai import errors, types
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

load_dotenv()
api_key=os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY is missing. Add it to your .env file")

model_name = os.getenv("GEMINI_MODEL")
if not model_name:
    raise RuntimeError("GEMINI_MODEL is missing. Add it to your .env file.")

client = genai.Client(
    api_key=api_key,
    http_options=types.HttpOptions(timeout=20000),
    )  


class ChatRequest(BaseModel):         
    model_config = ConfigDict(str_strip_whitespace=True)
    question: str = Field(min_length=1, max_length=1000)   #must match maxlength in html (frontend)      
class ChatResponse(BaseModel):
    answer: str


@app.get("/health")
def health():
    return {"status": "ok"}
@app.get("/documents")
def get_documents():
    here = Path(__file__).parent
    docs = load_documents(here/"adempro-docs")
    summaries=[]
    for doc in docs:
        summaries.append({
            "id": doc.id,
            "title": doc.title,
            "access": doc.access,
            "updated": doc.updated,
        })
    return summaries
@app.post("/chat")                
def chat(req: ChatRequest) -> ChatResponse:   
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=req.question,        
        )
    except httpx.TimeoutException as e:
        print(f"Gemini Timeout: {e}")
        raise HTTPException(status_code=504, detail="The assistant took too long to respond. Please try again later.")
    except errors.ServerError:
        raise HTTPException(status_code=503, detail="the model is busy right now please try again later")
    except errors.ClientError as e:
        print(f"Gemini client error: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again later.")
    return ChatResponse(answer=response.text)
