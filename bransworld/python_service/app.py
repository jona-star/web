from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI(title="Brans´World Reco Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"]
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/recommend")
def recommend(category: str, exclude: int | None = None, candidates: str | None = None):
    ids: List[int] = []
    if candidates:
        try:
            ids = [int(x) for x in candidates.split(',') if x.strip()]
        except Exception:
            ids = []
    # very naive ranking: reverse order to simulate some scoring variety
    ranked = list(reversed(ids))
    return {"ids": ranked[:10]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

