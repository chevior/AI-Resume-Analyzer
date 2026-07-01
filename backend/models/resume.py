class Resume:
    def __init__(self, text):
        self.text = text
        self.skills = []

    def get_text(self):
        return self.text

    def set_skills(self, skills):
        self.skills = skills

    def get_skills(self):
        return self.skills