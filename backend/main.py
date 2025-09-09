from fastapi import FastAPI, File, UploadFile, Depends
from fastapi.staticfiles import StaticFiles
import os, shutil
import requests
from dotenv import load_dotenv

from sqlalchemy.orm import Session
import models, database

import uuid
from openai import OpenAI
import base64
import json

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

REMOVE_BG_API_KEY = os.getenv('REMOVE_BG_API_KEY')

def get_db():
    db = database.SessionLocal()

    try:
        yield db
    finally:
        db.close()

def analyze_item_with_openai(file_path: str):
    """Send image to OpenAI for category + color classification."""
    with open(file_path, "rb") as f:
        img_bytes = f.read()
    b64_img = base64.b64encode(img_bytes).decode("utf-8")

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # vision-capable
        messages=[
            {
                "role": "system",
                "content": "You are a fashion AI. Return clothing category and color."
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Identify clothing category and color. Respond in JSON with keys `category` and `color`."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}},
                ],
            }
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "clothing_schema",
                "schema": {
                    "type": "object",
                    "properties": {
                        "category": {"type": "string"},
                        "color": {"type": "string"},
                    },
                    "required": ["category", "color"],
                },
            },
        }
    )

    result_text = response.choices[0].message.content
    return json.loads(result_text)

@app.post('/upload')
async def upload_file(file: UploadFile=File(...), db: Session = Depends(get_db)):

    response = requests.post(
        "https://api.remove.bg/v1.0/removebg",
        files={"image_file": (file.filename, file.file, file.content_type)},
        data={"size": "auto"},
        headers={"X-Api-Key": REMOVE_BG_API_KEY},
    )

    if response.status_code == 200:
        ext = os.path.splitext(file.filename)[1]  # e.g. ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"  # random unique filename
        processed_filename = f"processed_{unique_name}"

        file_path = os.path.join(UPLOAD_DIR, processed_filename)
        with open(file_path, "wb") as buffer:
            buffer.write(response.content)

        url = f"http://127.0.0.1:8000/uploads/{processed_filename}"

        ai_result = analyze_item_with_openai(file_path)
        # ai_result will look like: {"category": "shirt", "color": "blue"}

        # Step 4. Save record in DB
        clothing_item = models.ClothingItem(
            filename=processed_filename,
            url=url,
            category=ai_result["category"],
            color=ai_result["color"]
        )
        db.add(clothing_item)
        db.commit()
        db.refresh(clothing_item)

        return clothing_item.__dict__
    else:
        return {"error": response.text}
