import spacy
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

_models: dict = {}

MODEL_MAP = {
    "en": "en_core_web_sm",
    "es": "es_core_news_sm",
    "fr": "fr_core_news_sm",
    "ru": "ru_core_news_sm",
}


def load_model(lang: str):
    if lang not in _models:
        model_name = MODEL_MAP.get(lang)
        if model_name is None:
            raise HTTPException(status_code=400, detail=f"Unsupported language: '{lang}'")
        try:
            _models[lang] = spacy.load(model_name)
        except OSError:
            raise HTTPException(
                status_code=503,
                detail=f"spaCy model '{model_name}' not installed. "
                       f"Run: python -m spacy download {model_name}",
            )
    return _models[lang]


@asynccontextmanager
async def lifespan(app: FastAPI):
    for lang in MODEL_MAP:
        load_model(lang)
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://verbista.vercel.app", "http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


class ProcessRequest(BaseModel):
    text: str
    language: str


@app.get("/health")
def health():
    return {"status": "ok", "loaded_models": list(_models.keys())}


@app.post("/process")
def process_text(req: ProcessRequest):
    nlp = load_model(req.language)
    doc = nlp(req.text)

    tokens = []
    for sent_idx, sent in enumerate(doc.sents):
        for token in sent:
            tokens.append({
                "surface": token.text,
                "lemma": token.lemma_.lower(),
                "pos": token.pos_,
                "morph": token.morph.to_dict(),
                "position": token.idx,
                "sentence_index": sent_idx,
                "is_word": token.is_alpha,
            })

    sentences = [
        {
            "text": sent.text.strip(),
            "start": sent.start_char,
            "index": i,
        }
        for i, sent in enumerate(doc.sents)
    ]

    return {"tokens": tokens, "sentences": sentences}


if __name__ == "__main__":
    import os
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
