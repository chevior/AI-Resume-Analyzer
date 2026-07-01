class ATSAnalyzer:

    def calculate_score(self, skills):

        score = len(skills) * 10

        if score > 100:
            score = 100

        return score