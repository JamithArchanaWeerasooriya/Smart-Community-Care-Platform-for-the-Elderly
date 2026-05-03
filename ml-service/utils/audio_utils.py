import subprocess
import os

def convert_to_wav(input_path):

    base = os.path.splitext(input_path)[0]
    wav_path = base + ".wav"

    command = [
        "ffmpeg",
        "-y",
        "-loglevel", "error",
        "-fflags", "+genpts",
        "-i", input_path,
        "-ac", "1",
        "-ar", "16000",
        wav_path
    ]

    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if result.returncode != 0:
        print("FFmpeg error:", result.stderr.decode())
        raise Exception("FFmpeg conversion failed")

    if not os.path.exists(wav_path):
        raise Exception("WAV file not created")

    return wav_path