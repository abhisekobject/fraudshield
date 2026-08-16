"""
FraudShield — ML Training Pipeline
==================================
Loads synthetic dataset, pre-processes, trains a baseline (Logistic Regression) 
and a candidate (RandomForest/XGBoost), compares them, and serializes the best one.
"""

import os
import json
import pandas as pd
from datetime import datetime, timezone
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score, 
    confusion_matrix, average_precision_score
)

# Load the feature order explicitly from features.py to ensure identical schema
from app.ml.features import FEATURE_ORDER

# Optional XGBoost fallback
try:
    import xgboost as xgb
    HAS_XGBOOST = True
except Exception as e:
    print(f"XGBoost unavailable ({e}), falling back to RandomForest.")
    HAS_XGBOOST = False


DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "synthetic", "transactions.csv")
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ml", "models")
MODEL_ARTIFACT_PATH = os.path.join(MODEL_DIR, "model_v1.joblib")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

def load_data():
    print(f"Loading data from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    
    # Isolate strictly the features we defined
    X = df[FEATURE_ORDER]
    y = df["is_fraud"]
    
    return X, y

def build_preprocessing():
    """Builds identical preprocessing pipeline used during training and inference."""
    # We apply standard scaling to numericals.
    # In this dataset, all columns are numeric/boolean 1/0.
    numeric_transformer = Pipeline(steps=[
        ('scaler', StandardScaler())
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, FEATURE_ORDER)
        ])
    return preprocessor

def evaluate_model(name, model, X_test, y_test):
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    pr_auc = average_precision_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)
    
    print(f"\n--- {name} Evaluation ---")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC AUC:   {roc_auc:.4f}")
    print(f"PR AUC:    {pr_auc:.4f}")
    print("Confusion Matrix:")
    print(cm)
    
    return {
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "roc_auc": float(roc_auc),
        "pr_auc": float(pr_auc)
    }

def main():
    X, y = load_data()
    
    # 70% Train, 15% Val, 15% Test
    # For simplicity of this POC script, we will split 70/30 (Val/Test combined)
    # Stratify to preserve the 8% fraud class balance
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, stratify=y, random_state=42)
    
    print(f"Train samples: {len(X_train)}")
    print(f"Test samples:  {len(X_test)}")
    
    preprocessor = build_preprocessing()
    
    # 1. Baseline Model
    baseline = Pipeline(steps=[('preprocessor', preprocessor),
                               ('classifier', LogisticRegression(class_weight='balanced', max_iter=1000))])
    baseline.fit(X_train, y_train)
    evaluate_model("Baseline (Logistic Regression)", baseline, X_test, y_test)
    
    # 2. Candidate Model
    if HAS_XGBOOST:
        classifier_name = "XGBoost"
        classifier = xgb.XGBClassifier(scale_pos_weight=(len(y_train) - sum(y_train)) / sum(y_train), 
                                       eval_metric='logloss', random_state=42)
    else:
        classifier_name = "RandomForest"
        classifier = RandomForestClassifier(class_weight='balanced', random_state=42)
        
    candidate = Pipeline(steps=[('preprocessor', preprocessor),
                                ('classifier', classifier)])
    
    print(f"\nTraining Candidate: {classifier_name}...")
    candidate.fit(X_train, y_train)
    metrics = evaluate_model(f"Candidate ({classifier_name})", candidate, X_test, y_test)
    
    # Save the candidate model
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    artifact = {
        "model": candidate,
        "feature_names": FEATURE_ORDER,
        "version": "ml-v1",
        "type": classifier_name
    }
    
    joblib.dump(artifact, MODEL_ARTIFACT_PATH)
    print(f"\nModel artifact saved to {MODEL_ARTIFACT_PATH}")
    
    # Save metadata
    metadata = {
        "model_version": "ml-v1",
        "model_type": classifier_name,
        "training_seed": 42,
        "feature_list": FEATURE_ORDER,
        "training_sample_count": len(X_train),
        "test_sample_count": len(X_test),
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "evaluation_metrics": metrics
    }
    
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Metadata saved to {METADATA_PATH}")

if __name__ == "__main__":
    main()
