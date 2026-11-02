from pathlib import Path
from datetime import date
from hashlib import sha256
from dataclasses import dataclass
@dataclass
class Document:
    id: str
    title: str
    access: str
    updated: date
    content_hash: str           
    body: str
    source_path: str
def load_documents(folder:Path)->list[Document]:
    documents = []
    for file in folder.glob("*.md"):
        text = file.read_text(encoding="utf-8")
        before, frontmatter,body = text.split("---", 2)
        #print(f"{file.name} | {len(text)} characters | {frontmatter}")
        #print(f"body : {body[:50]}")
        meta ={}
        for line in frontmatter.splitlines():
            if not line.strip():
                continue
            key, sep ,value = line.partition(":")
            meta[key.strip()] = value.strip()
        for key in ["id","title","access","updated"]:
            if key not in meta:
                raise ValueError(f"{file.name} is missing a required field '{key}' ")
        if meta["access"] not in ["public","employees","hr"]:
            raise ValueError(f"{file.name} has an invalid access value '{meta['access']}'")
        meta["updated"] = date.fromisoformat(meta["updated"])
        meta["content_hash"] = sha256(body.encode("utf-8")).hexdigest()
        doc = Document(
            id=meta["id"],
            title=meta["title"],
            access=meta["access"],
            updated=meta["updated"],
            content_hash=meta["content_hash"],
            body=body,
            source_path=str(file)
        )
        documents.append(doc)
    return documents
here = Path(__file__).parent
docs = load_documents(here/"adempro-docs")
for doc in docs:
    print(f"{doc.id} | {doc.access} | {doc.updated} | {doc.content_hash[:8]}")
