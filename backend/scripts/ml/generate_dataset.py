"""
FraudShield — Synthetic Dataset Generator
=========================================
Generates a DEMONSTRATION synthetic dataset for ML model training.
This is NOT real banking data.
"""

import os
import random
import pandas as pd
import numpy as np

# Configuration
NUM_SAMPLES = 20000
FRAUD_RATIO = 0.08  # 8% suspicious scenarios
RANDOM_SEED = 42

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "synthetic")
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "transactions.csv")

def generate_legitimate_scenario():
    """Generates a typical legitimate transaction."""
    amount = np.random.lognormal(mean=5.0, sigma=1.0) # Typical amounts 100-1000
    
    # Usually familiar with recipient and device
    is_new_recipient = 1 if random.random() < 0.1 else 0
    recipient_tx_count = 0 if is_new_recipient else random.randint(1, 50)
    
    is_new_device = 1 if random.random() < 0.05 else 0
    device_tx_count = 0 if is_new_device else random.randint(5, 200)
    
    device_is_trusted = 1 if random.random() < 0.99 else 0
    
    amount_ratio = np.random.normal(loc=1.0, scale=0.5)
    amount_ratio = max(0.1, amount_ratio) # Usually close to 1.0, occasionally up to 2-3x
    
    # Velocity is usually low
    tx_10m = random.randint(0, 1)
    tx_1h = random.randint(tx_10m, tx_10m + 2)
    
    return {
        "amount": amount,
        "amount_ratio_to_average": amount_ratio,
        "device_is_trusted": device_is_trusted,
        "device_transaction_count": device_tx_count,
        "device_is_new": is_new_device,
        "recipient_transaction_count": recipient_tx_count,
        "recipient_is_new": is_new_recipient,
        "transactions_last_10_minutes": tx_10m,
        "transactions_last_1_hour": tx_1h,
        "is_fraud": 0
    }

def generate_suspicious_scenario():
    """Generates a suspicious transaction with overlapping distributions."""
    scenario_type = random.choice(["high_amount", "high_velocity", "new_context_high_amount"])
    
    # Start with base legitimate, then corrupt it
    base = generate_legitimate_scenario()
    base["is_fraud"] = 1
    
    if scenario_type == "high_amount":
        base["amount"] = np.random.lognormal(mean=8.0, sigma=1.5)
        base["amount_ratio_to_average"] = np.random.uniform(3.5, 10.0)
    elif scenario_type == "high_velocity":
        base["transactions_last_10_minutes"] = random.randint(4, 15)
        base["transactions_last_1_hour"] = random.randint(10, 30)
    elif scenario_type == "new_context_high_amount":
        base["amount"] = np.random.lognormal(mean=7.0, sigma=1.0)
        base["amount_ratio_to_average"] = np.random.uniform(2.5, 8.0)
        base["device_is_new"] = 1
        base["device_transaction_count"] = 0
        base["recipient_is_new"] = 1
        base["recipient_transaction_count"] = 0
        base["device_is_trusted"] = 0 if random.random() < 0.3 else 1
        
    return base

def main():
    print(f"Generating synthetic dataset with {NUM_SAMPLES} samples (seed={RANDOM_SEED})...")
    np.random.seed(RANDOM_SEED)
    random.seed(RANDOM_SEED)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    data = []
    num_fraud = int(NUM_SAMPLES * FRAUD_RATIO)
    num_legit = NUM_SAMPLES - num_fraud
    
    for _ in range(num_legit):
        data.append(generate_legitimate_scenario())
        
    for _ in range(num_fraud):
        data.append(generate_suspicious_scenario())
        
    # Shuffle
    random.shuffle(data)
    
    df = pd.DataFrame(data)
    df.to_csv(OUTPUT_PATH, index=False)
    
    print(f"Dataset generated at: {OUTPUT_PATH}")
    print(f"Total Rows: {len(df)}")
    print(f"Legitimate (0): {num_legit} ({100 - FRAUD_RATIO*100:.1f}%)")
    print(f"Suspicious (1): {num_fraud} ({FRAUD_RATIO*100:.1f}%)")
    
if __name__ == "__main__":
    main()
