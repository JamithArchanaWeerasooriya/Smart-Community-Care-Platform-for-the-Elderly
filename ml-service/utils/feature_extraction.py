import librosa
import numpy as np
import noisereduce as nr

def extract_features(file_path):

    audio, sr = librosa.load(file_path, sr=16000, mono=True)

    # noise reduction
    audio = nr.reduce_noise(y=audio, sr=sr)

    # normalize
    audio = librosa.util.normalize(audio)

    # remove silence
    audio, _ = librosa.effects.trim(audio, top_db=20)

    target_length = 16000 * 5

    if len(audio) < target_length:
        padding = target_length - len(audio)
        audio = np.pad(audio, (0, padding))
    else:
        start = (len(audio) - target_length) // 2
        audio = audio[start:start + target_length]

    mfcc = librosa.feature.mfcc(
        y=audio,
        sr=sr,
        n_mfcc=40
    )

    mfcc_scaled = np.mean(mfcc.T, axis=0)

    return mfcc_scaled