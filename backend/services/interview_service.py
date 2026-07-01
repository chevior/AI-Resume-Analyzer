def generate_questions(skills):

    base_questions = [
        "Tell me about yourself",
        "What is your strongest project?"
    ]

    tech_questions = []

    for skill in skills:
        tech_questions.append(f"Explain your experience with {skill}")

    return base_questions + tech_questions