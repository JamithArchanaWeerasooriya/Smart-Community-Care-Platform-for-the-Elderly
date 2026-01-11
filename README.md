Real-Time Emotion Detection (CNN)

A real-time facial emotion recognition application using Python, OpenCV, and TensorFlow/Keras. This application captures video from the webcam, detects faces, and classifies emotions using a pre-trained Convolutional Neural Network (CNN).

Features
Real-Time Detection: Seamless processing of live webcam feeds.
7 Emotion Classes: Detects Angry, Disgust, Fear, Happy, Sad, Surprise, and Neutral.
Live Statistics: Visualizes the probability distribution for all emotion classes in real-time.
Visual Feedback: Color-coded bounding boxes and confidence scores.
Performance Metrics: Built-in FPS (Frames Per Second) counter.

Tech Stack
Python 3.x
OpenCV (cv2): For face detection (Haar Cascades) and image processing.
TensorFlow / Keras: For loading and running the deep learning model.
NumPy: For matrix operations and image array manipulation.

Project Structure
Ensure your directory looks like this before running:
├── cnnapp.py                     # The main application script
├── emotion_detection_model.h5    # The pre-trained Keras model (Required)
├── class_labels.json             # JSON mapping of indices to labels (Required)
└── README.md

Installation
Clone the repository:
git clone https://github.com/JamithArchanaWeerasooriya/Smart-Community-Care-Platform-for-the-Elderly
cd emotion-detection-cnn

Install dependencies:
It is recommended to use a virtual environment.
pip install opencv-python tensorflow numpy

Model Setup:
Ensure you have your trained model saved as emotion_detection_model.h5.
Ensure you have the class_labels.json file in the same directory.
Note: This application expects the input to the model to be a 48x48 grayscale image.

Usage
Run the script using Python:
python cnnapp.py

Controls
Once the webcam window is active, use the following keyboard shortcuts:

Q : Quit the application.
S : Toggle the Statistics (probability bars) overlay.
F : Toggle the FPS (Frames Per Second) display.

How It Works
Face Detection: The app uses OpenCV's haarcascade_frontalface_default.xml to identify faces in the video frame.
Preprocessing: Detected faces are cropped, converted to grayscale, resized to 48x48 pixels, and normalized (pixel values scaled between 0 and 1).
Inference: The processed image is passed to the loaded CNN model (.h5).
Visualization: The class with the highest probability is displayed on the screen with a specific color code:
🔴 Angry (Red)
🟢 Disgust (Green)
🟣 Fear (Purple)
🟡 Happy (Yellow)
🔵 Sad (Blue)
🟠 Surprise (Orange)
⚪ Neutral (Gray)

Troubleshooting
Error: Cannot access webcam
Check if another application is using the camera.
If using an external camera, you may need to change cv2.VideoCapture(0) to cv2.VideoCapture(1) in the code.
Error loading model / labels
Ensure emotion_detection_model.h5 and class_labels.json are in the exact same folder as the script.
Check file permissions.

License
MIT License
