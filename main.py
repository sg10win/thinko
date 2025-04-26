from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import random
import json

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

# Sample riddles stored in the backend
with open("riddles.json", "r", encoding="utf-8") as f:
    riddles = json.load(f)


@app.get("/", response_class=HTMLResponse)
async def read_root():
    html_path = Path("static/index.html")
    return html_path.read_text(encoding="utf-8")

@app.get("/riddle", response_class=JSONResponse)
async def get_riddle():
    riddle = random.choice(riddles)
    return {"question": riddle["question"], "answer": riddle["answer"], "hint": riddle["hint"]}
