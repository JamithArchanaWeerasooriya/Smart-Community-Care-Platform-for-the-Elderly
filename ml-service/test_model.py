import numpy as np
from tensorflow.keras.models import load_model
from utils.feature_extraction import extract_features

model = load_model("model/snore_detection_model.h5")

file_path = "test_audio/snore_test.wav"

features = extract_features(file_path)

features = np.expand_dims(features, axis=0)

prediction = model.predict(features)[0][0]

print("Prediction value:", prediction)

if prediction > 0.3:
    print("Snore detected")
else:
    print("Non-snore")