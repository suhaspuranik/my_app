# main.py
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from models.langid_model import detect_language
import shutil
import os
import tempfile
from fastapi.responses import JSONResponse

app = FastAPI()  # This is the app instance

# Allow CORS for all domains (can be restricted later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/detect-language/")
async def detect_language_api(file: UploadFile = File(...)):
    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run detection
    predicted_lang = detect_language(file_path)

    return {"predicted_language": predicted_lang}


@app.post("/detect/live-audio")
async def detect_live_audio(file: UploadFile = File(...)):
    try:
        # Save uploaded file to a temp location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Use model inference
        language = detect_language(tmp_path)
        return JSONResponse({"language": language})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)