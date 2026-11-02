from fastapi import FastAPI
from document_loader import load_documents
from pathlib import Path
import os
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel
from fastapi import HTTPException
from google.genai import errors
app = FastAPI()
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))  

class ChatRequest(BaseModel):         
    question: str           
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
            model="gemini-3.8-flash",
            contents=req.question,        
        )
    except errors.ServerError:
        raise HTTPException(status_code=503, detail="the model is busy right now please try again later")
    except errors.ClientError as e:
        print(f"Gemini client error: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong. Please try again later.")
    return ChatResponse(answer=response.text)  