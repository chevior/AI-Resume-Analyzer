def extract_skills(text):

    keywords = [
        "python", "java", "javascript", "typescript", "flask", "django",
        "react", "node.js", "node", "express", "sql", "mysql",
        "postgresql", "mongodb", "machine learning", "deep learning",
        "ai", "data analysis", "pandas", "numpy", "excel", "power bi",
        "tableau", "css", "html", "tailwind", "bootstrap", "docker",
        "kubernetes", "aws", "azure", "gcp", "git", "github", "ci/cd",
        "rest api", "graphql", "linux", "agile", "testing"
    ]

    text_lower = text.lower()

    found = [skill for skill in keywords if skill in text_lower]

    return found
