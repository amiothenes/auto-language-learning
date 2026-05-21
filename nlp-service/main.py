import logging
import spacy
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_models: dict = {}

MODEL_MAP = {
    "en": "en_core_web_sm",
    "es": "es_core_news_sm",
    "ru": "ru_core_news_sm",
}

FALLBACK_MODEL = "xx_ent_wiki_sm"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Eagerly load every model at startup so missing models fail fast."""
    missing = []
    for lang, model_name in MODEL_MAP.items():
        try:
            _models[lang] = spacy.load(model_name)
            logger.info("Loaded spaCy model '%s' for language '%s'", model_name, lang)
        except OSError:
            missing.append(model_name)
            logger.error(
                "spaCy model '%s' (language '%s') is not installed", model_name, lang
            )

    if missing:
        raise RuntimeError(
            f"Required spaCy models are missing and must be installed before starting: "
            f"{', '.join(missing)}. "
            f"Run: python -m spacy download <model>"
        )

    logger.info("All spaCy models loaded successfully: %s", list(_models.keys()))
    yield


app = FastAPI(lifespan=lifespan)


def load_model(lang: str):
    if lang not in _models:
        model_name = MODEL_MAP.get(lang, FALLBACK_MODEL)
        try:
            _models[lang] = spacy.load(model_name)
        except OSError:
            raise HTTPException(
                status_code=503,
                detail=f"spaCy model '{model_name}' not installed. "
                       f"Run: python -m spacy download {model_name}",
            )
    return _models[lang]


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
