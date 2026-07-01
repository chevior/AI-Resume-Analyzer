def extract_skills(text):

    keywords = [
        "python", "java", "flask", "react", "sql",
        "machine learning", "ai", "css", "html",
        "docker", "aws", "git"
    ]

    text_lower = text.lower()

    found = [skill for skill in keywords if skill in text_lower]

    return found