import requests
import json
import time
import tempfile
from pydub import AudioSegment
from fastapi import UploadFile

def convert_mp4_to_mp3_via_freeconvert(upload_file: UploadFile) -> AudioSegment:
    # Step 1: Upload the file to FreeConvert
    files = {
        'file': (upload_file.filename, upload_file.file, upload_file.content_type)
    }

    upload_resp = requests.post('https://api.freeconvert.com/v1/upload', files=files)
    if upload_resp.status_code != 200:
        raise Exception(f"Upload failed: {upload_resp.text}")

    file_url = upload_resp.json()['file']['url']

    # Step 2: Create a job to convert MP4 to MP3
    job_payload = {
        "tasks": {
            "import-my-file": {
                "operation": "import/url",
                "url": file_url
            },
            "convert-my-file": {
                "operation": "convert",
                "input": "import-my-file",
                "input_format": "mp4",
                "output_format": "mp3",
                "options": {
                    "audio_codec": "auto",
                    "audio_filter_volume": 100,
                    "audio_filter_fade_in": False,
                    "audio_filter_fade_out": False,
                    "audio_filter_reverse": False,
                    "cut_start": "00:00:00"
                }
            }
        }
    }

    job_resp = requests.post(
        'https://api.freeconvert.com/v1/process/jobs',
        headers={"Content-Type": "application/json"},
        data=json.dumps(job_payload)
    )

    if job_resp.status_code != 200:
        raise Exception(f"Job creation failed: {job_resp.text}")

    job_id = job_resp.json()["id"]

    # Step 3: Poll job status
    while True:
        status_resp = requests.get(f"https://api.freeconvert.com/v1/process/jobs/{job_id}")
        status_json = status_resp.json()
        status = status_json["status"]

        if status == "completed":
            mp3_url = status_json["output"][0]["url"]
            break
        elif status == "error":
            raise Exception(f"Conversion failed: {status_json}")
        time.sleep(2)

    # Step 4: Download converted mp3
    r = requests.get(mp3_url)
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        f.write(r.content)
        mp3_path = f.name

    # Step 5: Load audio with pydub
    return AudioSegment.from_file(mp3_path, format="mp3")
