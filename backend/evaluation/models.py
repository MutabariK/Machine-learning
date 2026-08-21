from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

LIKERT = [MinValueValidator(1), MaxValueValidator(5)]


class EvaluationResponse(models.Model):
    AGE_CHOICES = [
        ('18-25', '18-25'),
        ('26-35', '26-35'),
        ('36-45', '36-45'),
        ('46-55', '46-55'),
        ('56+', '56 and above'),
    ]
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Prefer not to say'),
    ]
    EDUCATION_CHOICES = [
        ('secondary', 'Secondary/High School'),
        ('diploma', 'Diploma/Certificate'),
        ('bachelors', "Bachelor's Degree"),
        ('masters', "Master's Degree"),
        ('doctorate', 'Doctorate'),
        ('other', 'Other'),
    ]
    FREQUENCY_CHOICES = [
        ('never', 'Never'),
        ('rarely', 'Rarely (a few times a year)'),
        ('sometimes', 'Sometimes (monthly)'),
        ('often', 'Often (weekly)'),
        ('always', 'Always (daily)'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='evaluation')

    # Demographics
    age_range = models.CharField(max_length=10, choices=AGE_CHOICES)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    education = models.CharField(max_length=20, choices=EDUCATION_CHOICES)
    digital_service_frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    reported_issue_before = models.BooleanField()
    county_of_residence = models.CharField(max_length=100)

    # TAM — Perceived Usefulness (Davis, 1989)
    pu_1 = models.IntegerField(validators=LIKERT, help_text="Using this system improves my ability to carry out my tasks on the platform")
    pu_2 = models.IntegerField(validators=LIKERT, help_text="Using this system makes it easier to track complaint resolution")
    pu_3 = models.IntegerField(validators=LIKERT, help_text="Using this system enhances my engagement with county government")
    pu_4 = models.IntegerField(validators=LIKERT, help_text="I find this system useful for monitoring public service delivery")
    pu_5 = models.IntegerField(validators=LIKERT, help_text="Using this system increases my productivity in carrying out my tasks on the platform")
    pu_6 = models.IntegerField(validators=LIKERT, help_text="Overall, I find this system useful")

    # TAM — Perceived Ease of Use (Davis, 1989)
    peou_1 = models.IntegerField(validators=LIKERT, help_text="Learning to use this system was easy for me")
    peou_2 = models.IntegerField(validators=LIKERT, help_text="I find it easy to get this system to do what I want")
    peou_3 = models.IntegerField(validators=LIKERT, help_text="My interaction with this system is clear and understandable")
    peou_4 = models.IntegerField(validators=LIKERT, help_text="I find this system to be flexible to interact with")
    peou_5 = models.IntegerField(validators=LIKERT, help_text="It was easy for me to become skillful at using this system")
    peou_6 = models.IntegerField(validators=LIKERT, help_text="Overall, I find this system easy to use")

    # TAM — Behavioral Intention to Use
    bi_1 = models.IntegerField(validators=LIKERT, help_text="I intend to continue using this system for my role on the platform")
    bi_2 = models.IntegerField(validators=LIKERT, help_text="I would recommend this system to others")
    bi_3 = models.IntegerField(validators=LIKERT, help_text="I plan to use this system frequently in the future")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'evaluation_responses'
        ordering = ['-created_at']

    @property
    def tam_perceived_usefulness(self):
        return round((self.pu_1 + self.pu_2 + self.pu_3 + self.pu_4 + self.pu_5 + self.pu_6) / 6, 2)

    @property
    def tam_perceived_ease_of_use(self):
        return round((self.peou_1 + self.peou_2 + self.peou_3 + self.peou_4 + self.peou_5 + self.peou_6) / 6, 2)

    @property
    def tam_behavioral_intention(self):
        return round((self.bi_1 + self.bi_2 + self.bi_3) / 3, 2)

    def __str__(self):
        return f"Evaluation by {self.user.full_name} — PU: {self.tam_perceived_usefulness}"
