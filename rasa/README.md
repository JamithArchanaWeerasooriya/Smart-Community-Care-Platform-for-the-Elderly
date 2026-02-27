# Rasa Sinhala Voice Assistant

This folder contains the Rasa-based Sinhala language assistant used in the **Smart Community Care Platform for the Elderly**. It understands spoken Sinhala commands (via browser speech recognition), extracts intents and entities with Rasa, and exposes them through a Flask backend for the main system.

## Folder Structure

- `install.bat` – Creates a Python virtual environment and installs Rasa and backend libraries.
- `fresh_start_backend.bat` – Trains a fresh Rasa model, moves it to the backend, then starts the Flask backend server.
- `only_train.bat` – Trains a fresh Rasa model and moves it to the backend (no server start).
- `start_backend.bat` – Starts the Flask backend server using an already-trained model.
- `Libraries.txt` – Summary of required Python version and key installation commands.
- `Data.txt` – High-level description of intents, entities, and example Sinhala NLU data.
- `backend/` – Lightweight Flask service that loads the trained Rasa model and exposes the `/parse` HTTP API.
  - `main.py` – Loads `backend/models/model.gz` as a Rasa `Agent` and serves POST `/parse`.
  - `models/` – Destination folder where the trained Rasa `.gz` model is copied and renamed to `model.gz`.
- `rasa/` – Standard Rasa project.
  - `config.yml` – Rasa configuration (pipeline and policies – currently using Rasa defaults).
  - `domain.yml` – Domain definition (intents and responses).
  - `data/`
    - `nlu.yml` – Main Sinhala NLU training data (navigation, reminders, emergencies, helpers, etc.).
    - `page_synonyms.yml` – Entity synonyms (e.g., different Sinhala words mapping to `home`, `my-reminders`, `all`).
    - `rules.yml` – Rule-based behaviors (e.g., goodbye, bot challenge).
    - `stories.yml` – Sample dialogue stories used for training.
  - `actions/` – Placeholder for custom action server code (currently just the default example).
  - `models/` – Rasa-generated models during training (intermediate – later copied to `backend/models`).
  - `tests/` – Test stories for Rasa (`rasa test`).
- `WebSite/`
  - `index.html` – Browser demo that uses the Web Speech API (Sinhala `si-LK`) to capture voice, send text to `/parse`, and display detected intent/entities.
- `venv/` – Local Python virtual environment (created by `install.bat`).

## Requirements

- Windows (batch scripts are written for Windows).
- Python **3.9.13** (see `Libraries.txt`).
- Internet access for installing Python packages (first-time setup).

## 1. One-Time Installation

From this `rasa` folder (where `install.bat` is located), run:

```bat
install.bat
```

This will:

- Create a virtual environment: `py -m venv venv`
- Activate it: `venv\Scripts\activate`
- Upgrade pip
- Install required libraries: `flask`, `flask-cors`, `rasa==3.6.20`

If you prefer manual installation:

```bat
py -m venv venv
venv\Scripts\activate
pip install --upgrade pip
pip install flask flask-cors rasa==3.6.20
```

## 2. Training the Rasa Model

You can train the NLU and dialogue model using the provided batch scripts or manual commands.

### Option A – Train + Prepare Backend Model (no server start)

From the `rasa` folder:

```bat
only_train.bat
```

This script will:

1. Activate the virtual environment: `venv\Scripts\activate`
2. Delete old models in `backend/models` and `rasa/rasa/models`
3. Change into the Rasa project folder: `cd rasa`
4. Run training: `rasa train`
5. Move the latest `.gz` model from `rasa/rasa/models` to `backend/models/`
6. Rename it to `model.gz` inside `backend/models`

### Option B – Train + Start Backend Immediately

From the `rasa` folder:

```bat
fresh_start_backend.bat
```

This does the same as **Option A** and then additionally:

- Starts the Flask backend with: `flask --app main.py --debug run` in the `backend` folder.

### Manual Training (for advanced use)

```bat
venv\Scripts\activate
cd rasa\rasa
rasa train
```

After training finishes, copy the generated model (a `.tar.gz`/`.gz` archive in `rasa/rasa/models`) into `backend/models` and rename it `model.gz`, matching what `main.py` expects.

## 3. Running the Flask Rasa Backend

If you already have a trained model in `backend/models/model.gz`, you can start the backend without retraining.

From the `rasa` folder:

```bat
start_backend.bat
```

This will:

- Activate the virtual environment
- Start the Flask app from `backend/main.py` in debug mode on port **5000**

Alternatively, run manually:

```bat
venv\Scripts\activate
cd backend
flask --app main.py --debug run
```

### `/parse` API

The backend exposes a single endpoint:

- **URL:** `http://localhost:5000/parse`
- **Method:** `POST`
- **Request body (JSON):**

  ```json
  {
    "message": "මට හවස 5ට බෙහෙත් බොන්න මතක් කරන්න"
  }
  ```

- **Response (JSON, simplified):**

  ```json
  {
    "intent": "set_reminder",
    "entities": [
      { "entity": "time", "value": "හවස 5" },
      { "entity": "task", "value": "බෙහෙත් බොන්න" }
    ]
  }
  ```

This is what the main system and the `WebSite/index.html` demo consume.

## 4. Voice Command Demo Website

The `WebSite/index.html` file is a standalone demo UI for testing the Rasa NLU:

- Uses the browser **SpeechRecognition / webkitSpeechRecognition** API with `recognition.lang = 'si-LK'` (Sinhala).
- On each recognized utterance, it sends the text to `http://localhost:5000/parse`.
- Displays a history of:
  - The spoken transcript
  - Detected intent
  - Extracted entities (with Sinhala-friendly fonts)

To use it:

1. Ensure the Flask backend is running (`start_backend.bat` or `fresh_start_backend.bat`).
2. Open `WebSite/index.html` in a modern browser (Chrome/Edge recommended).
3. Click **Start Listening**, speak in Sinhala, and watch the results appear in the history list.

## 5. Rasa NLU & Dialog Design

### Main Intents

The NLU data in `rasa/rasa/data/nlu.yml` covers several main intent groups (in Sinhala):

- `navigation` – Navigate between pages like home and my-reminders.
- `set_reminder` – Create reminders with date, time, and task (e.g., taking medicine, paying bills).
- `update_reminder` – Change or delay existing reminders.
- `delete_reminder` – Cancel specific reminders or all reminders for a given day.
- `check_reminder` – Ask what reminders are scheduled (today, tomorrow, etc.).
- `set_emergency_alert` – Express emergencies or health issues, and ask for help.
- `find_helper` – Request help from a helper/caregiver for tasks.
- `check_status` – Ask about schedule, daily status, or completion of tasks.
- `cancel_command` – Cancel ongoing commands.
- `greeting`, `goodbye`, `affirm`, `deny`, `thanks` – General conversational intents.

### Key Entities

Common entities used across the dataset include (names as used in the NLU data):

- `time` / `time_period` – Specific times and periods of the day.
- `date` – Absolute and relative dates (today, tomorrow, next week, etc.).
- `event` / `event_period` – Recurrence patterns (e.g., every day, every week).
- `task` – The activity to be reminded of (take medicine, pay bills, call someone, etc.).
- `person` – People involved (e.g., son, daughter, helper).
- `location` – Places such as hospital or shop.
- `context` – Emergency or health-related context.
- `page` – Target page for navigation (home, my-reminders).

Entity synonyms for navigation and quantifiers (e.g., different Sinhala spellings and English words mapping to `home`, `my-reminders`, `all`) are defined in `rasa/rasa/data/page_synonyms.yml`.

## 6. Useful Rasa Commands (inside `rasa/rasa`)

After activating the virtual environment and changing into the inner `rasa` project folder:

```bat
venv\Scripts\activate
cd rasa\rasa

rem Train model
rasa train

rem Test stories
rasa test

rem Inspect NLU predictions in shell
rasa shell nlu
```

These commands are optional during normal project usage (the batch files already wrap `rasa train`), but they are helpful when experimenting with or extending the assistant.

---

This README documents the Rasa-based Sinhala assistant and backend that power your part of the **Smart Community Care Platform for the Elderly**, including installation, training, running, and how it integrates with voice input and the rest of the system.
