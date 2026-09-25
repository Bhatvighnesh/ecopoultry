"""
Minimal Flask microservice serving the one Decision Tree productivity
classifier. The Node backend (ml.service.js) calls POST /predict with the
five live sensor-derived features every time a new environment reading
arrives; this returns the classification, confidence, and the tree's
feature importances so the dashboard can show "which inputs drove this".

Run:
    pip install -r requirements.txt
    python generate_synthetic_data.py
    python train_model.py
    python app.py
"""

import os
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "productivity_model.joblib")

app = Flask(__name__)
CORS(app)

_bundle = None


def load_model():
    global _bundle
    if _bundle is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"No trained model at {MODEL_PATH}. Run generate_synthetic_data.py then train_model.py."
            )
        _bundle = joblib.load(MODEL_PATH)
    return _bundle


@app.get("/health")
def health():
    try:
        load_model()
        return jsonify({"status": "ok", "modelLoaded": True})
    except FileNotFoundError as exc:
        return jsonify({"status": "ok", "modelLoaded": False, "detail": str(exc)}), 200


@app.post("/predict")
def predict():
    bundle = load_model()
    model = bundle["model"]
    features = bundle["features"]

    body = request.get_json(force=True, silent=True) or {}
    try:
        row = [
            float(body["temperature"]),
            float(body["humidity"]),
            float(body["gas"]),
            float(body["activity"]),
            float(body["feedTrend"]),
        ]
    except (KeyError, TypeError, ValueError) as exc:
        return jsonify({"error": f"Invalid or missing feature: {exc}"}), 400

    classification = model.predict([row])[0]
    proba = model.predict_proba([row])[0]
    class_index = list(model.classes_).index(classification)
    confidence = float(proba[class_index])

    importances = dict(zip(features, model.feature_importances_.tolist()))
    feature_importances = {
        "temperature": importances["temperature"],
        "humidity": importances["humidity"],
        "gas": importances["gas"],
        "activity": importances["activity"],
        "feedTrend": importances["feed_trend"],
    }

    return jsonify(
        {
            "classification": classification,
            "confidence": round(confidence, 4),
            "featureImportances": feature_importances,
        }
    )


if __name__ == "__main__":
    # PORT is what Render (and most PaaS hosts) inject; ML_SERVICE_PORT is used
    # for local dev to match ml.service.js's default ML_SERVICE_URL.
    port = int(os.environ.get("PORT", os.environ.get("ML_SERVICE_PORT", 5001)))
    app.run(host="0.0.0.0", port=port, debug=False)
