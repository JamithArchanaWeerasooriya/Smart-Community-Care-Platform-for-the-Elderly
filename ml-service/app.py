from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
import uuid

from tensorflow.keras.models import load_model
from utils.feature_extraction import extract_features
from utils.audio_utils import convert_to_wav

app = Flask(__name__)
CORS(app)

# Load AI model once
model = load_model("model/snore_detection_model.h5")

UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


@app.route("/")
def home():
    return "Snore Detection API Running"


@app.route("/api/sleep/predict", methods=["POST"])
def predict():

    filepath = None
    wav_path = None

    try:

        if "audio" not in request.files:
            return jsonify({"error": "No audio uploaded"}), 400

        file = request.files["audio"]

        # get extension
        ext = os.path.splitext(file.filename)[1].lower()

        if ext == "":
            ext = ".webm"

        # create unique filename
        filename = f"{uuid.uuid4()}{ext}"

        filepath = os.path.join(UPLOAD_FOLDER, filename)

        file.save(filepath)

        print("Uploaded file:", filepath)

        # ⭐ Detect if already WAV
        if ext == ".wav":
            wav_path = filepath
        else:
            try:
                wav_path = convert_to_wav(filepath)
            except Exception as e:
                print("FFmpeg conversion error:", e)

                return jsonify({
                    "prediction": "non-snore",
                    "probability": 0
                })

        print("Audio for model:", wav_path)

        if not os.path.exists(wav_path):
            raise Exception("WAV file not found")

        # Extract audio features
        features = extract_features(wav_path)

        features = np.expand_dims(features, axis=0)

        # Model prediction
        prediction = model.predict(features)[0][0]

        print("Prediction value:", prediction)

        result = "snore" if prediction > 0.96 else "non-snore"

        return jsonify({
            "prediction": result,
            "probability": float(prediction)
        })

    except Exception as e:

        print("Prediction error:", str(e))

        return jsonify({
            "error": "Prediction failed",
            "message": str(e)
        }), 500

    finally:

        # Clean temporary files safely
        try:

            if filepath and os.path.exists(filepath):
                os.remove(filepath)

            # delete converted wav only if different
            if wav_path and wav_path != filepath and os.path.exists(wav_path):
                os.remove(wav_path)

        except Exception as cleanup_error:
            print("Cleanup error:", cleanup_error)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)