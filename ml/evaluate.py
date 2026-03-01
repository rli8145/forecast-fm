import matplotlib.pyplot as plt
import pandas as pd
from sklearn.metrics import ConfusionMatrixDisplay, confusion_matrix, f1_score
from sklearn.inspection import permutation_importance
from sklearn.model_selection import KFold, StratifiedKFold, cross_val_score, train_test_split

from data import load_data, features
from models import naive_bayes, logistic_regression, random_forest, gradient_boosting


# F1 SCORE
def evaluate_f1(name: str, model, X_train, X_test, y_train, y_test) -> float:
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)
    score = f1_score(y_test, predictions, average="weighted")
    print(f"{name} F1 Score: {score:.4f}")
    return score

# CROSS VALIDATION F1
def build_cv(y: pd.Series, n_splits: int = 5, random_state: int = 42):
    min_class_count = y.value_counts().min()
    if min_class_count >= 2:
        splits = min(n_splits, min_class_count)
        return StratifiedKFold(n_splits=splits, shuffle=True, random_state=random_state)
    splits = min(n_splits, len(y))
    if splits < 2:
        raise ValueError("not enough samples for cross-validation")
    return KFold(n_splits=splits, shuffle=True, random_state=random_state)

def cross_validate(name: str, model, X, y, cv) -> list[float]:
    scores = cross_val_score(model, X, y, cv=cv, scoring="f1_weighted")
    mean_score = scores.mean()
    std_score = scores.std()
    print(f"{name} CV F1 Score: {mean_score:.4f} (+/- {std_score:.4f})")
    return scores.tolist()

# PERMUTATION IMPORTANCE
def evaluate_permutation_importance(
    name: str,
    model,
    X,
    y,
    n_repeats: int = 10,
    random_state: int = 42,
) -> pd.Series:
    model.fit(X, y)
    result = permutation_importance(
        model,
        X,
        y,
        n_repeats=n_repeats,
        random_state=random_state,
        scoring="f1_weighted",
    )
    importance = pd.Series(result.importances_mean, index=features).sort_values(ascending=False)
    print(f"{name} permutation importance:")
    print(importance.to_string())
    return importance

# SPEARMAN CORRELATION
def compute_spearman(X: pd.DataFrame, y: pd.Series) -> pd.DataFrame:
    y_codes = y.astype("category").cat.codes
    df = X.copy()
    df["weather_code"] = y_codes
    corr = df.corr(method="spearman")
    print("Spearman correlation matrix (including weather_code):")
    print(corr.to_string())
    return corr

def plot_spearman(X: pd.DataFrame, y: pd.Series) -> None:
    corr = compute_spearman(X, y)
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)
    ax.set_xticks(range(len(corr.columns)))
    ax.set_yticks(range(len(corr.index)))
    ax.set_xticklabels(corr.columns, rotation=45, ha="right")
    ax.set_yticklabels(corr.index)
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    ax.set_title("Spearman Correlation")
    fig.tight_layout()
    plt.show()

# CONFUSION MATRICES
def plot_confusion_matrices(
    models: dict[str, object],
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
    X: pd.DataFrame,
    y: pd.Series,
    cv,
) -> None:
    labels = sorted(y.unique())
    fig, axes = plt.subplots(1, len(models), figsize=(5 * len(models), 4))
    if len(models) == 1:
        axes = [axes]

    for ax, (name, model) in zip(axes, models.items()):
        cross_validate(name, model, X, y, cv)
        evaluate_f1(name, model, X_train, X_test, y_train, y_test)
        evaluate_permutation_importance(name, model, X_train, y_train)
        predictions = model.predict(X_test)
        matrix = confusion_matrix(y_test, predictions, labels=labels)
        print(f"{name} confusion matrix:")
        print(matrix)
        ConfusionMatrixDisplay(matrix, display_labels=labels).plot(ax=ax, cmap="Blues", colorbar=False)
        ax.set_title(name.replace("_", " ").title())

    fig.tight_layout()
    plt.show()

# MAIN EVALUATION FUNCTION
def main() -> None:
    X, y = load_data()
    cv = build_cv(y)
    models = {
        "Naive Bayes": naive_bayes(),
        "Logistic Regression": logistic_regression(),
        "Random Forest": random_forest(),
        "Gradient Boosting": gradient_boosting(),
    }

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y if (y.value_counts() >= 2).all() else None,
    )

    plot_spearman(X, y)

    plot_confusion_matrices(models, X_train, X_test, y_train, y_test, X, y, cv)

if __name__ == "__main__":
    main()
