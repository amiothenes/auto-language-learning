FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --timeout 300 -r requirements.txt

RUN set -e && \
    python -m spacy download en_core_web_sm && \
    python -m spacy download es_core_news_sm && \
    python -m spacy download ru_core_news_sm

# Validate that every model can actually be imported before the image is finalised
RUN python - <<'EOF'
import spacy, sys
models = ["en_core_web_sm", "es_core_news_sm", "ru_core_news_sm"]
failed = []
for m in models:
    try:
        spacy.load(m)
        print(f"[OK] {m}")
    except OSError as e:
        print(f"[FAIL] {m}: {e}", file=sys.stderr)
        failed.append(m)
if failed:
    sys.exit(f"Model validation failed for: {', '.join(failed)}")
EOF

COPY . .

CMD uvicorn main:app --host 0.0.0.0 --port $PORT
