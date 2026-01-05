import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from rasa.core.agent import Agent

app = Flask(__name__)
CORS(app)
agent = None  # global agent

# Load Rasa model asynchronously
async def load_model():
    global agent
    agent = Agent.load("models/model.gz")
    print("Rasa model loaded successfully.")

# Run async model loading once at startup
asyncio.run(load_model())

@app.route("/parse", methods=["POST"])
def parse_message():
    if not agent:
        return jsonify({"error": "Model not loaded yet"}), 503

    data = request.get_json()
    message = data.get("message")

    if not message:
        return jsonify({"error": "Missing 'message' parameter"}), 400

    # Parse message asynchronously
    result = asyncio.run(agent.parse_message(message))
    print(result)

    # Extract only intent and entities
    intent = result.get("intent", {}).get("name")
    entities = [
        {"entity": e.get("entity"), "value": e.get("value")}
        for e in result.get("entities", [])
    ]

    return jsonify({
        "intent": intent,
        "entities": entities
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
