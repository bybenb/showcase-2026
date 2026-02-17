"""Database Models"""

from datetime import datetime
from app import db
import uuid


class User(db.Model):
    """Usuário da plataforma"""

    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255))
    avatar_url = db.Column(db.Text)
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    streak = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    # Relacionamentos
    progress = db.relationship("UserProgress", backref="user", lazy=True, cascade="all, delete-orphan")
    answers = db.relationship("UserAnswer", backref="user", lazy=True, cascade="all, delete-orphan")
    fsrs_states = db.relationship("FSRSState", backref="user", lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.username}>"


class Course(db.Model):
    """Curso de idioma"""

    __tablename__ = "courses"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    language_from = db.Column(db.String(10))  # pt_BR, en_US, es_ES
    language_to = db.Column(db.String(10))
    difficulty_level = db.Column(db.String(20))  # beginner, intermediate, advanced
    icon_url = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    lessons = db.relationship("Lesson", backref="course", lazy=True, cascade="all, delete-orphan")
    progress = db.relationship("UserProgress", backref="course", lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Course {self.title}>"


class Lesson(db.Model):
    """Lição dentro de um curso"""

    __tablename__ = "lessons"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id = db.Column(db.String(36), db.ForeignKey("courses.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    order_index = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    exercises = db.relationship("Exercise", backref="lesson", lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Lesson {self.title}>"


class Exercise(db.Model):
    """Exercício dentro de uma lição"""

    __tablename__ = "exercises"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lesson_id = db.Column(db.String(36), db.ForeignKey("lessons.id"), nullable=False, index=True)
    exercise_type = db.Column(db.String(50), nullable=False)  # translation, listening, multiple_choice
    question = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.Text, nullable=False)
    hints = db.Column(db.String(500))  # JSON string
    difficulty = db.Column(db.Integer, default=1)  # 1-5
    order_index = db.Column(db.Integer)
    audio_url = db.Column(db.Text)  # Caminho para áudio local
    image_url = db.Column(db.Text)  # Caminho para imagem local
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    answers = db.relationship("UserAnswer", backref="exercise", lazy=True, cascade="all, delete-orphan")
    fsrs_state = db.relationship("FSRSState", backref="exercise", lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Exercise {self.id}>"


class UserProgress(db.Model):
    """Progresso do usuário em um curso"""

    __tablename__ = "user_progress"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    course_id = db.Column(db.String(36), db.ForeignKey("courses.id"), index=True)
    xp_earned = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    last_activity = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<UserProgress user={self.user_id} course={self.course_id}>"


class UserAnswer(db.Model):
    """Resposta do usuário a um exercício"""

    __tablename__ = "user_answers"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    exercise_id = db.Column(db.String(36), db.ForeignKey("exercises.id"), nullable=False, index=True)
    answer = db.Column(db.Text)
    is_correct = db.Column(db.Boolean)
    response_time = db.Column(db.Integer)  # milliseconds
    difficulty_rating = db.Column(db.Integer)  # 1-5 (como o usuário achou de difícil)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<UserAnswer user={self.user_id} exercise={self.exercise_id}>"


class FSRSState(db.Model):
    """Estado FSRS para spaced repetition"""

    __tablename__ = "fsrs_state"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    exercise_id = db.Column(db.String(36), db.ForeignKey("exercises.id"), nullable=False, index=True)
    stability = db.Column(db.Float, default=0.0)
    difficulty = db.Column(db.Float, default=5.0)
    elapsed_days = db.Column(db.Integer, default=0)
    scheduled_days = db.Column(db.Integer, default=1)
    reps = db.Column(db.Integer, default=0)
    lapses = db.Column(db.Integer, default=0)
    state = db.Column(db.String(20), default="new")  # new, learning, review
    last_review = db.Column(db.DateTime)
    next_review = db.Column(db.DateTime, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    db.UniqueConstraint("user_id", "exercise_id", name="unique_user_exercise")

    def __repr__(self):
        return f"<FSRSState user={self.user_id} exercise={self.exercise_id}>"
