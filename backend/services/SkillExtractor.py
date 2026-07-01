from skills import skills

class SkillExtractor:

    def extract(self, text):

        found_skills = []

        text = text.lower()

        for skill in skills:
            if skill in text:
                found_skills.append(skill)

        return found_skills