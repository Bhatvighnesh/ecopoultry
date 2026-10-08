"""
Minimal Flask microservice serving the one Decision Tree productivity
classifier. The Node backend (ml.service.js) calls POST /predict with the
five live sensor-derived features every time a new environment reading
arrives; this returns the classification, confidence, and a per-reading
breakdown of which features drove *this* prediction (derived from the actual
decision path, not the model's fixed global feature_importances_), so the
dashboard can show "which inputs drove this" and have it vary reading to
reading.

Run:
    pip install -r requirements.txt
    python generate_synthetic_data.py
    python train_model.py
    python app.py
"""

import os
import joblib
import numpy as np
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


def instance_feature_weights(model, row, class_index):
    """
    Per-reading feature weights, derived from the actual decision path this
    row took through the tree (not the model-wide feature_importances_, which
    is a single fixed array and would look "stuck" across readings).

    At each split on the path, we measure how much that split moved the
    predicted class's probability (class distribution at the child vs. the
    parent node) and credit that movement to the feature used at the split.
    This is the standard "tree interpreter" decomposition for a single tree.
    """
    tree = model.tree_
    node_path = model.decision_path([row]).indices  # root -> leaf, in order

    def class_proba(node_id):
        counts = tree.value[node_id][0]
        total = counts.sum()
        return counts / total if total > 0 else counts

    n_features = len(row)
    weights = np.zeros(n_features)
    for i in range(len(node_path) - 1):
        current_node, next_node = node_path[i], node_path[i + 1]
        feat_idx = tree.feature[current_node]
        delta = class_proba(next_node)[class_index] - class_proba(current_node)[class_index]
        weights[feat_idx] += abs(delta)

    total = weights.sum()
    return weights / total if total > 0 else np.full(n_features, 1 / n_features)


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

    weights = instance_feature_weights(model, row, class_index)
    importances = dict(zip(features, weights.tolist()))
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
