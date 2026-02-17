"""Script para popular banco com dados de teste"""

from app import create_app, db
from app.models import User, Course, Lesson, Exercise
import uuid
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Limpar dados antigos (opcional)
    # db.drop_all()
    # db.create_all()

    # Criar usuário de teste
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        username="testuser",
        password_hash=generate_password_hash("test123"),
        full_name="Test User",
        xp=0,
        level=1,
    )
    db.session.add(user)

    # Criar curso: English for Beginners
    course = Course(
        id=str(uuid.uuid4()),
        title="English for Beginners",
        description="Learn English from Portuguese - Beginner Level",
        language_from="pt_BR",
        language_to="en_US",
        difficulty_level="beginner",
    )
    db.session.add(course)
    db.session.flush()  # Flush para obter o ID

    # Criar lições
    lesson1 = Lesson(
        id=str(uuid.uuid4()),
        course_id=course.id,
        title="Greetings",
        description="Learn how to greet people in English",
        order_index=1,
    )

    lesson2 = Lesson(
        id=str(uuid.uuid4()),
        course_id=course.id,
        title="Numbers 1-10",
        description="Count from 1 to 10 in English",
        order_index=2,
    )

    db.session.add(lesson1)
    db.session.add(lesson2)
    db.session.flush()

    # Criar exercícios para Lição 1
    exercises_lesson1 = [
        Exercise(
            id=str(uuid.uuid4()),
            lesson_id=lesson1.id,
            exercise_type="translation",
            question="Translate: 'Hello'",
            correct_answer="Olá",
            hints="Saudação comum,Significa cumprimento",
            difficulty=1,
            order_index=1,
        ),
        Exercise(
            id=str(uuid.uuid4()),
            lesson_id=lesson1.id,
            exercise_type="translation",
            question="Translate: 'Good morning'",
            correct_answer="Bom dia",
            hints="Cumprimento matinal,De manhã",
            difficulty=1,
            order_index=2,
        ),
        Exercise(
            id=str(uuid.uuid4()),
            lesson_id=lesson1.id,
            exercise_type="translation",
            question="Translate: 'How are you?'",
            correct_answer="Como você está?",
            hints="Pergunta de saudação,Sobre o estado",
            difficulty=2,
            order_index=3,
        ),
        Exercise(
            id=str(uuid.uuid4()),
            lesson_id=lesson1.id,
            exercise_type="translation",
            question="Translate: 'I am fine'",
            correct_answer="Estou bem",
            hints="Resposta a 'How are you?',Afirmar que está bem",
            difficulty=2,
            order_index=4,
        ),
    ]

    for ex in exercises_lesson1:
        db.session.add(ex)

    # Criar exercícios para Lição 2
    exercises_lesson2 = [
        Exercise(
            id=str(uuid.uuid4()),
            lesson_id=lesson2.id,
            exercise_type="translation",
            question="Translate: 'one'",
            correct_answer="um",
            hints="Primeiro número,Dígito",
            difficulty=1,
            order_index=1,
        ),
        Exercise(
            id=str(uuid.uuid4()),
            lesson_id=lesson2.id,
            exercise_type="translation",
            question="Translate: 'two'",
            correct_answer="dois",
            hints="Segundo número,Par",
            difficulty=1,
            order_index=2,
        ),
        Exercise(
            id=str(uuid.uuid4()),
            lesson_id=lesson2.id,
            exercise_type="translation",
            question="Translate: 'five'",
            correct_answer="cinco",
            hints="Número do meio,Metade de dez",
            difficulty=1,
            order_index=3,
        ),
        Exercise(
            id=str(uuid.uuid4()),
            lesson_id=lesson2.id,
            exercise_type="translation",
            question="Translate: 'ten'",
            correct_answer="dez",
            hints="Último número,Dois dígitos",
            difficulty=2,
            order_index=4,
        ),
    ]

    for ex in exercises_lesson2:
        db.session.add(ex)

    # Commit de tudo
    db.session.commit()

    print("✅ Dados de teste criados com sucesso!")
    print(f"   - Usuário: test@example.com / test123")
    print(f"   - Curso: {course.title}")
    print(f"   - Lições: {len([lesson1, lesson2])}")
    print(f"   - Exercícios: {len(exercises_lesson1) + len(exercises_lesson2)}")
