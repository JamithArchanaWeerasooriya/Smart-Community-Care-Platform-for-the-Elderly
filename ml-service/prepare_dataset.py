import os
import numpy as np
from tqdm import tqdm
from utils.feature_extraction import extract_features

DATASET_PATH = "dataset"

features = []
labels = []

classes = [
    "breathe",
    "bruxism",
    "cough",
    "movements",
    "non_wearer",
    "quiet",
    "sneezing",
    "snore",
    "somniloquy",
    "swallow"
]

for label in classes:

    folder = os.path.join(DATASET_PATH, label)

    for file in tqdm(os.listdir(folder)):

        path = os.path.join(folder, file)

        try:

            feature = extract_features(path)

            features.append(feature)

            if label == "snore":
                labels.append(1)
            else:
                labels.append(0)

        except:
            print("Error processing:", path)

X = np.array(features)
y = np.array(labels)

np.save("X.npy", X)
np.save("y.npy", y)

print("Dataset prepared")
print("Feature shape:", X.shape)