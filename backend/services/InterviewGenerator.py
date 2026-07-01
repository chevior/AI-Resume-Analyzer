class InterviewGenerator:

    def generate(self, skills):

        questions = []

        if "java" in skills:
            questions.append(
                "Explain OOP concepts in Java."
            )

        if "python" in skills:
            questions.append(
                "What are decorators?"
            )

        if "sql" in skills:
            questions.append(
                "Difference between DELETE and TRUNCATE?"
            )

        if "react" in skills:
            questions.append(
                "What is Virtual DOM?"
            )

        return questions