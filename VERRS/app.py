import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from tensorflow import keras

MODEL_PATH = "emotion_detection_model.h5"
IMG_SIZE = 48

class_labels = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]

app = FastAPI()

# Allow React frontend (localhost:3000) to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# Load trained model
model = keras.models.load_model(MODEL_PATH)

# Load face detection model
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

def preprocess_face(face_img):
    face_img = cv2.resize(face_img, (IMG_SIZE, IMG_SIZE))
    face_img = face_img.astype("float32") / 255.0
    face_img = np.expand_dims(face_img, axis=0)
    face_img = np.expand_dims(face_img, axis=-1)
    return face_img


@app.post("/detect-emotion")
async def detect_emotion(file: UploadFile = File(...)):

    # Read uploaded image into memory
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        return {"error": "Invalid image"}

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    if len(faces) == 0:
        return {"message": "No face detected"}

    # Use largest detected face
    largest = max(faces, key=lambda f: f[2] * f[3])
    x, y, w, h = largest

    face = gray[y:y+h, x:x+w]
    face = preprocess_face(face)

    prediction = model.predict(face)
    emotion_index = np.argmax(prediction[0])
    emotion = class_labels[emotion_index]
    confidence = float(prediction[0][emotion_index] * 100)

    return {
        "emotion": emotion,
        "confidence": round(confidence, 2)
    }