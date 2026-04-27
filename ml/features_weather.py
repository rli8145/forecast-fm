import pandas as pd
from data import load_data, features
from train import main

X, y = load_data()
model = main()["Gradient Boosting"]

song = []
print("Enter song features in order")
for f in features:
    value = float(input(f"{f}: "))
    song.append(value)

X_new = pd.DataFrame([song], columns=features)

pred = model.predict(X_new)[0]
print(f"Save this song for {pred} days!")