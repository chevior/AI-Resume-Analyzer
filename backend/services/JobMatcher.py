class JobMatcher:

    def match(self, resume_skills, jd_skills):

        matched = []

        for skill in resume_skills:
            if skill in jd_skills:
                matched.append(skill)

        if len(jd_skills) == 0:
            return 0

        return int(
            len(matched) / len(jd_skills) * 100
        )