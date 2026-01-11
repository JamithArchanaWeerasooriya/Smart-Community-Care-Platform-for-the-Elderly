import cv2
import numpy as np
import json
from tensorflow import keras
import sys

MODEL_PATH = 'emotion_detection_model.h5'
LABELS_PATH = 'class_labels.json'
IMG_SIZE = 48

print("="*70)
print("CNN-BASED EMOTION DETECTION - REAL-TIME TEST")
print("="*70)

print("\n[1/3] Loading CNN model...")
try:
    model = keras.models.load_model(MODEL_PATH)
    print("✓ Model loaded successfully!")
except Exception as e:
    print(f"✗ Error loading model: {e}")
    print(f"  Make sure '{MODEL_PATH}' exists")
    sys.exit(1)

print("\n[2/3] Loading class labels...")
try:
    with open(LABELS_PATH, 'r') as f:
        class_labels = json.load(f)
    print(f"✓ Loaded {len(class_labels)} emotion classes:")
    print(f"  {', '.join(class_labels)}")
except Exception as e:
    print(f"✗ Error loading class labels: {e}")
    print(f"  Make sure '{LABELS_PATH}' exists")
    sys.exit(1)

print("\n[3/3] Loading face detector...")
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)
print("✓ Face detector loaded!")

print("\n" + "="*70)
print("Initializing webcam...")
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)


if not cap.isOpened():
    print("✗ Error: Cannot access webcam")
    sys.exit(1)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)

print("✓ Webcam started successfully!")
print("="*70)
print("\nCONTROLS:")
print("  'q' - Quit")
print("  's' - Toggle statistics display")
print("  'f' - Toggle FPS display")
print("="*70 + "\n")

emotion_colors = {
    'angry': (0, 0, 255),      # Red
    'disgust': (0, 128, 0),    # Dark Green
    'fear': (128, 0, 128),     # Purple
    'happy': (0, 255, 255),    # Yellow
    'sad': (255, 0, 0),        # Blue
    'surprise': (0, 165, 255), # Orange
    'neutral': (128, 128, 128) # Gray
}

def preprocess_face(face_img):
    """Preprocess face image for CNN model prediction"""

    face_img = cv2.resize(face_img, (IMG_SIZE, IMG_SIZE))
    
    if len(face_img.shape) == 3:
        face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    
    face_img = face_img.astype('float32') / 255.0
    
    face_img = np.expand_dims(face_img, axis=0)
    face_img = np.expand_dims(face_img, axis=-1)
    
    return face_img

import time
frame_count = 0
start_time = time.time()
fps = 0
show_stats = True
show_fps = True

print("Starting real-time detection...\n")

while True:
    ret, frame = cap.read()
    
    if not ret:
        print("✗ Error: Cannot read frame from webcam")
        break

    frame_count += 1
    if frame_count % 10 == 0:
        end_time = time.time()
        fps = 10 / (end_time - start_time)
        start_time = time.time()

    display_frame = frame.copy()

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )

    for (x, y, w, h) in faces:
        face_roi = gray[y:y+h, x:x+w]

        processed_face = preprocess_face(face_roi)

        predictions = model.predict(processed_face, verbose=0)
        emotion_idx = np.argmax(predictions[0])
        emotion_label = class_labels[emotion_idx]
        confidence = predictions[0][emotion_idx] * 100

        color = emotion_colors.get(emotion_label.lower(), (255, 255, 255))

        cv2.rectangle(display_frame, (x, y), (x+w, y+h), color, 3)

        text = f"{emotion_label.upper()}"
        confidence_text = f"{confidence:.1f}%"

        (text_width, text_height), baseline = cv2.getTextSize(
            text, cv2.FONT_HERSHEY_SIMPLEX, 1.2, 2
        )
        (conf_width, conf_height), _ = cv2.getTextSize(
            confidence_text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2
        )

        padding = 10
        cv2.rectangle(
            display_frame,
            (x, y - text_height - conf_height - padding * 3),
            (x + max(text_width, conf_width) + padding * 2, y),
            color,
            -1
        )

        cv2.putText(
            display_frame,
            text,
            (x + padding, y - conf_height - padding * 2),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.2,
            (255, 255, 255),
            2,
            cv2.LINE_AA
        )

        cv2.putText(
            display_frame,
            confidence_text,
            (x + padding, y - padding),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2,
            cv2.LINE_AA
        )

        if show_stats:
            stats_x = 10
            stats_y = 30

            cv2.rectangle(
                display_frame,
                (stats_x - 5, stats_y - 25),
                (stats_x + 250, stats_y + len(class_labels) * 30 + 5),
                (0, 0, 0),
                -1
            )
            cv2.rectangle(
                display_frame,
                (stats_x - 5, stats_y - 25),
                (stats_x + 250, stats_y + len(class_labels) * 30 + 5),
                (255, 255, 255),
                2
            )

            cv2.putText(
                display_frame,
                "EMOTION PROBABILITIES",
                (stats_x, stats_y - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1,
                cv2.LINE_AA
            )

            for i, label in enumerate(class_labels):
                prob = predictions[0][i] * 100
                bar_length = int(prob * 1.5)

                cv2.rectangle(
                    display_frame,
                    (stats_x + 100, stats_y + i * 30 + 20),
                    (stats_x + 100 + bar_length, stats_y + i * 30 + 30),
                    emotion_colors.get(label.lower(), (255, 255, 255)),
                    -1
                )

                prob_text = f"{label}: {prob:.1f}%"
                cv2.putText(
                    display_frame,
                    prob_text,
                    (stats_x, stats_y + i * 30 + 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (255, 255, 255),
                    1,
                    cv2.LINE_AA
                )

    if show_fps:
        cv2.putText(
            display_frame,
            f"FPS: {fps:.1f}",
            (frame.shape[1] - 120, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2,
            cv2.LINE_AA
        )

    cv2.putText(
        display_frame,
        "MODEL: CNN",
        (frame.shape[1] - 150, frame.shape[0] - 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        1,
        cv2.LINE_AA
    )

    cv2.putText(
        display_frame,
        "Q: Quit | S: Stats | F: FPS",
        (10, frame.shape[0] - 10),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        1,
        cv2.LINE_AA
    )

    cv2.imshow('CNN Emotion Detection - Real-time', display_frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('s'):
        show_stats = not show_stats
        print(f"Statistics display: {'ON' if show_stats else 'OFF'}")
    elif key == ord('f'):
        show_fps = not show_fps
        print(f"FPS display: {'ON' if show_fps else 'OFF'}")

cap.release()
cv2.destroyAllWindows()
print("\n" + "="*70)
print("Webcam closed. Goodbye!")
print("="*70)