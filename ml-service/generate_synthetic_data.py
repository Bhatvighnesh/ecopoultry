"""
Generates a SYNTHETIC, domain-rule-labeled training dataset for the flock
productivity classifier.

IMPORTANT / HONESTY NOTE: No real farm data exists for this project yet. Every
row here is generated from sensible poultry-husbandry domain rules (not
measured on a real flock), then given a small amount of random noise so the
classifier doesn't just memorize hard thresholds. This is clearly a
simplification of real flock health, and the resulting model should be
treated as a reasonable placeholder / proof-of-concept, not a validated
diagnostic tool. See README "Known Limitations" for the full disclosure.

Features:
  temperature   deg C   (DHT11 range ~0-50, coop realistic ~15-40)
  humidity      % RH    (DHT11 range 20-90)
  gas           0-4095  (MQ135 raw ADC, higher = more ammonia/CO2 buildup)
  activity      count/min (PIR activity, higher = more movement)
  feed_trend    g/hr    (recent feed consumption rate; low/declining = concern)

Label rules (domain heuristics, not measured outcomes):
  - Critical: high gas AND (low activity OR low feed_trend), OR extreme temperature
  - Watch: any single moderately-off signal (elevated gas, mild heat, mildly low
    activity/feed) without the compounding pattern above
  - Healthy: everything within comfortable ranges
"""

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)
N_ROWS = 600


def label_row(temperature, humidity, gas, activity, feed_trend):
    extreme_temp = temperature >= 38 or temperature <= 10
    high_gas = gas >= 2200
    low_activity = activity <= 3
    low_feed = feed_trend <= 20

    if extreme_temp or (high_gas and (low_activity or low_feed)):
        return "Critical"

    mild_heat = temperature >= 33
    elevated_gas = gas >= 1400
    mild_low_activity = activity <= 6
    mild_low_feed = feed_trend <= 35
    high_humidity = humidity >= 75

    flags = sum([mild_heat, elevated_gas, mild_low_activity, mild_low_feed, high_humidity])
    if flags >= 2:
        return "Watch"
    if flags == 1:
        return "Watch"

    return "Healthy"


def generate():
    rows = []
    for _ in range(N_ROWS):
        temperature = RNG.normal(28, 6)
        humidity = RNG.normal(60, 12)
        gas = RNG.normal(1200, 700)
        activity = RNG.normal(10, 5)
        feed_trend = RNG.normal(45, 20)

        temperature = float(np.clip(temperature, 5, 45))
        humidity = float(np.clip(humidity, 20, 95))
        gas = float(np.clip(gas, 0, 4095))
        activity = float(np.clip(activity, 0, 30))
        feed_trend = float(np.clip(feed_trend, 0, 100))

        label = label_row(temperature, humidity, gas, activity, feed_trend)
        rows.append(
            {
                "temperature": round(temperature, 1),
                "humidity": round(humidity, 1),
                "gas": round(gas, 0),
                "activity": round(activity, 1),
                "feed_trend": round(feed_trend, 1),
                "label": label,
            }
        )
    return pd.DataFrame(rows)


if __name__ == "__main__":
    df = generate()
    df.to_csv("synthetic_training_data.csv", index=False)
    print(f"Wrote {len(df)} synthetic rows to synthetic_training_data.csv")
    print(df["label"].value_counts())
