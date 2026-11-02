from fastapi import FastAPI
from document_loader import load_documents
from pathlib import Path
app = FastAPI()
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
