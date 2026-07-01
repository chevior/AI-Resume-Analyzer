class SkillGapAnalyzer:

    def find_missing(
            self,
            resume_skills,
            jd_skills):

        missing = []

        for skill in jd_skills:

            if skill not in resume_skills:
                missing.append(skill)

        return missing