def calculate_ats(skills, text):

    base_score = 40

    skill_score = len(skills) * 6
    length_score = min(len(text) / 100, 30)

    final_score = base_score + skill_score + length_score

    return min(round(final_score, 2), 100)