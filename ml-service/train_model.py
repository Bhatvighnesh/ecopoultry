"""
Trains the ONE Decision Tree classifier used in this project (flock
productivity status: Healthy / Watch / Critical) on the synthetic
domain-rule-labeled dataset produced by generate_synthetic_data.py, and
saves it with joblib for the Flask serving endpoint (app.py) to load.

Run:
    python generate_synthetic_data.py
    python train_model.py
"""

import os
import joblib
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

FEATURES = ["temperature", "humidity", "gas", "activity", "feed_trend"]
DATA_PATH = os.path.join(os.path.dirname(__file__), "synthetic_training_data.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "productivity_model.joblib")


def main():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(
            f"{DATA_PATH} not found. Run `python generate_synthetic_data.py` first."
        )

    df = pd.read_csv(DATA_PATH)
    X = df[FEATURES]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Shallow, small tree on purpose: this is one simple classifier for a
    # final-year project, not a tuned production model.
    clf = DecisionTreeClassifier(max_depth=5, min_samples_leaf=5, random_state=42)
    clf.fit(X_train, y_train)

    print("Test set performance:")
    print(classification_report(y_test, clf.predict(X_test)))

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump({"model": clf, "features": FEATURES, "classes": list(clf.classes_)}, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
