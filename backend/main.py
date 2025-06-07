import os
import json
import hashlib
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydub import AudioSegment
from google.cloud import speech_v1p1beta1 as speech
from google.cloud import storage
import whisper
from models.langid_model import detect_language
import shutil


# === FastAPI App ===
app = FastAPI(title="Audio Captioning with Whisper + Google STT")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Directories ===
UPLOAD_DIR = "static/uploads"
CACHE_DIR = "static/cache"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

# === Google Credentials ===
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "language.json"
GCS_BUCKET_NAME = "language_buckets"
storage_client = storage.Client()
bucket = storage_client.bucket(GCS_BUCKET_NAME)

# === Constants ===
MAX_INLINE_DURATION_MS = 60 * 1000  # 1 minute
MAX_CHUNK_SIZE_BYTES = 10 * 1024 * 1024  # 10MB

# === Helpers ===
def get_file_hash(content: bytes) -> str:
    return hashlib.md5(content).hexdigest()

def check_cache(file_hash: str) -> Optional[dict]:
    cache_file = Path(CACHE_DIR) / f"{file_hash}.json"
    if cache_file.exists():
        with open(cache_file, "r") as f:
            return json.load(f)
    return None

def save_to_cache(file_hash: str, result: dict):
    cache_file = Path(CACHE_DIR) / f"{file_hash}.json"
    with open(cache_file, "w") as f:
        json.dump(result, f)

def preprocess_audio(input_path: str, output_path: str):
    audio = AudioSegment.from_file(input_path)
    if audio.dBFS < -45:
        raise HTTPException(400, detail="Audio too silent to transcribe.")
    audio = audio.set_channels(1).set_frame_rate(16000).normalize().high_pass_filter(50)
    audio.export(output_path, format="wav")

def get_audio_duration(audio_path: str) -> float:
    return len(AudioSegment.from_file(audio_path))

def upload_to_gcs(file_path: str, destination_blob_name: str) -> str:
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(file_path)
    return f"gs://{GCS_BUCKET_NAME}/{destination_blob_name}"

def detect_language_with_whisper(audio_path: str) -> str:
    model = whisper.load_model("base")
    audio = whisper.load_audio(audio_path)
    audio = whisper.pad_or_trim(audio)
    mel = whisper.log_mel_spectrogram(audio).to(model.device)
    _, probs = model.detect_language(mel)
    lang_code = max(probs, key=probs.get)
    return lang_code

# === Google STT Processing ===
async def process_short_audio(audio_path: str, file_hash: str, language: str):
    clean_path = audio_path.replace(".wav", "_clean.wav")
    preprocess_audio(audio_path, clean_path)

    client = speech.SpeechClient()
    with open(clean_path, "rb") as f:
        byte_data = f.read()

    audio = speech.RecognitionAudio(content=byte_data)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        language_code=language,
        enable_automatic_punctuation=True,
    )

    try:
        response = client.recognize(config=config, audio=audio)
        if not response.results:
            raise HTTPException(400, detail="No transcription results returned")

        full_text = " ".join([r.alternatives[0].transcript for r in response.results if r.alternatives]).strip()
        confidence = response.results[0].alternatives[0].confidence if response.results else 0.0

        result = {
            "caption": full_text,
            "language": language,
            "confidence": round(confidence, 3),
            "provider": "Google STT",
            "cached": False
        }

        save_to_cache(file_hash, result)
        return JSONResponse(content=result)

    finally:
        os.remove(clean_path)
        os.remove(audio_path)

async def process_long_audio(audio_path: str, file_hash: str, language: str):
    clean_path = audio_path.replace(".wav", "_clean.wav")
    preprocess_audio(audio_path, clean_path)

    gcs_blob_name = f"audio_{file_hash}.wav"
    gcs_uri = upload_to_gcs(clean_path, gcs_blob_name)

    client = speech.SpeechClient()
    audio = speech.RecognitionAudio(uri=gcs_uri)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        language_code=language,
        enable_automatic_punctuation=True,
        model="latest_long"
    )

    try:
        operation = client.long_running_recognize(config=config, audio=audio)
        response = operation.result(timeout=120)

        if not response.results:
            raise HTTPException(400, detail="No transcription results returned")

        full_text = " ".join([r.alternatives[0].transcript for r in response.results if r.alternatives]).strip()
        confidence = response.results[0].alternatives[0].confidence if response.results else 0.0

        result = {
            "caption": full_text,
            "language": language,
            "confidence": round(confidence, 3),
            "provider": "Google STT",
            "cached": False
        }

        save_to_cache(file_hash, result)
        return JSONResponse(content=result)

    finally:
        os.remove(clean_path)
        os.remove(audio_path)
        blob = bucket.blob(gcs_blob_name)
        if blob.exists():
            blob.delete()

# === Routes ===
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "provider": "Whisper + Google STT",
        "max_duration_sec": 60,
        "max_file_size_MB": 10,
        "note": "Only MP3 and WAV files supported"
    }

@app.post("/caption/live-audio/")
async def caption_audio(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if len(contents) > MAX_CHUNK_SIZE_BYTES:
            raise HTTPException(413, detail="File size exceeds 10MB")

        file_hash = get_file_hash(contents)
        if cached := check_cache(file_hash):
            cached["cached"] = True
            return JSONResponse(content=cached)

        file_ext = Path(file.filename).suffix
        if file_ext not in [".mp3", ".wav"]:
            raise HTTPException(400, detail="Only MP3 and WAV files are supported")

        temp_path = f"{UPLOAD_DIR}/{file_hash}{file_ext}"
        with open(temp_path, "wb") as f:
            f.write(contents)

        # Detect language
        detected_lang = detect_language_with_whisper(temp_path)
        print(f"[Whisper] Detected language: {detected_lang}")

        # Transcribe
        duration = get_audio_duration(temp_path)
        if duration > MAX_INLINE_DURATION_MS:
            return await process_long_audio(temp_path, file_hash, detected_lang)
        else:
            return await process_short_audio(temp_path, file_hash, detected_lang)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Audio processing error: {str(e)}")
    

import whisper
import tempfile
from fastapi import UploadFile, File
from fastapi.responses import JSONResponse

# Load Whisper model once
whisper_model = whisper.load_model("base")

def detect_language_whisper(audio_path: str) -> str:
    audio = whisper.load_audio(audio_path)
    audio = whisper.pad_or_trim(audio)
    mel = whisper.log_mel_spectrogram(audio).to(whisper_model.device)
    _, probs = whisper_model.detect_language(mel)
    language = max(probs, key=probs.get)
    return language

# @app.post("/detect/live-audio")
# async def detect_live_audio(file: UploadFile = File(...)):
#     try:
#         # Save uploaded file to a temporary .wav file
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
#             tmp.write(await file.read())
#             tmp_path = tmp.name

#         # Use Whisper to detect language
#         language = detect_language_whisper(tmp_path)
#         return JSONResponse({"language": language})
#     except Exception as e:
#         return JSONResponse({"error": str(e)}, status_code=500)
#     finally:
#         if os.path.exists(tmp_path):
#             os.remove(tmp_path)


ALLOWED_LANGUAGES = {
    "hi": "Hindi",
    "kn": "Kannada",
    "ta": "Tamil",
    "ml": "Malayalam",
    "mr": "Marathi",
    "pa": "Punjabi",
    "ur": "Urdu",
    "bn": "Bengali",
    "gu": "Gujarati",
    "te": "Telugu",
    "en": "English"
}

def detect_language_whisper(file_path: str) -> str:
    # Your existing Whisper logic here
    # Example:
    import whisper
    model = whisper.load_model("base")
    result = model.transcribe(file_path, task="transcribe", language=None)
    return result.get("language")  # returns ISO code like 'hi', 'en'

@app.post("/detect/live-audio")
async def detect_live_audio(file: UploadFile = File(...)):
    tmp_path = None
    try:
        # Save uploaded file to a temporary .wav file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Detect language
        detected_lang_code = detect_language_whisper(tmp_path)
        if detected_lang_code in ALLOWED_LANGUAGES:
            return JSONResponse({"language": ALLOWED_LANGUAGES[detected_lang_code]})
        else:
            return JSONResponse({"error": "Audio is not clear or language not supported."}, status_code=400)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)









# @app.post("/detect-language/")
# async def detect_language_api(file: UploadFile = File(...)):
#     # Save uploaded file
#     file_path = os.path.join(UPLOAD_DIR, file.filename)
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     # Run detection
#     predicted_lang = detect_language(file_path)

#     return {"language": predicted_lang}

from typing import Dict, Any

@app.post("/detect-language/")
async def detect_language_api(file: UploadFile = File(...)) -> Dict[str, Any]:
    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run detection - now returns both language and confidence
    language, confidence = detect_language(file_path)

    return {
        "language": language,
        "confidence": confidence,
        "confidence_percentage": f"{confidence * 100:.2f}%"
    }
    

import logging



from googletrans import Translator

translator = Translator()

async def transcribe_audio_file(audio_path: str, file_ext: str):
    with open(audio_path, "rb") as f:
        contents = f.read()

    file_hash = get_file_hash(contents)

    if cached := check_cache(file_hash):
        cached["cached"] = True
        return cached

    detected_lang = detect_language_whisper(audio_path)
    print(f"[Whisper] Detected language: {detected_lang}")

    duration = get_audio_duration(audio_path)
    if duration > MAX_INLINE_DURATION_MS:
        result = await process_long_audio(audio_path, file_hash, detected_lang)
    else:
        result = await process_short_audio(audio_path, file_hash, detected_lang)

    return result.body if isinstance(result, JSONResponse) else result


@app.post("/translate/audio/")
async def translate_audio(tgt_lang: str, file: UploadFile = File(...)):
    tmp_path = f"temp_{file.filename}"
    try:
        with open(tmp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_ext = Path(file.filename).suffix
        transcript_result = await transcribe_audio_file(tmp_path, file_ext)

        original_text = transcript_result["caption"]
        detected_lang = transcript_result.get("language", "unknown")

        # Perform translation using googletrans
        translated_text = translator.translate(original_text, tgt_lang).text

        return {
            "original_text": original_text,
            "translated_text": translated_text,
            "language": detected_lang
        }

    except Exception as e:
        logging.error(f"Translation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.on_event("startup")
async def startup_event():
    print("[Startup] Whisper + Google STT backend initialized")
