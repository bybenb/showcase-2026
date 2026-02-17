"""Rotas de Cursos"""

from flask import Blueprint, request, jsonify
from flask_jwt_required import jwt_required, get_jwt_identity
from app import db
from app.models import Course, Lesson, Exercise, UserProgress

bp = Blueprint("courses", __name__, url_prefix="/api/courses")


@bp.route("", methods=["GET"])
def list_courses():
    """Listar todos os cursos"""
    courses = Course.query.all()
    return jsonify([
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "language_from": c.language_from,
            "language_to": c.language_to,
            "difficulty_level": c.difficulty_level,
            "icon_url": c.icon_url,
            "lessons_count": len(c.lessons),
        }
        for c in courses
    ]), 200


@bp.route("/<course_id>", methods=["GET"])
@jwt_required()
def get_course(course_id):
    """Obter detalhes de um curso"""
    course = Course.query.get(course_id)

    if not course:
        return jsonify({"error": "Curso não encontrado"}), 404

    user_id = get_jwt_identity()
    progress = UserProgress.query.filter_by(user_id=user_id, course_id=course_id).first()

    return jsonify({
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "language_from": course.language_from,
        "language_to": course.language_to,
        "difficulty_level": course.difficulty_level,
        "icon_url": course.icon_url,
        "lessons": [
            {
                "id": l.id,
                "title": l.title,
                "description": l.description,
                "order": l.order_index,
                "exercises_count": len(l.exercises),
            }
            for l in course.lessons
        ],
        "user_progress": {
            "xp_earned": progress.xp_earned if progress else 0,
            "level": progress.level if progress else 1,
            "last_activity": progress.last_activity.isoformat() if progress and progress.last_activity else None,
        } if progress else None,
    }), 200


@bp.route("/<course_id>/lessons/<lesson_id>", methods=["GET"])
@jwt_required()
def get_lesson(course_id, lesson_id):
    """Obter lição com seus exercícios"""
    lesson = Lesson.query.filter_by(id=lesson_id, course_id=course_id).first()

    if not lesson:
        return jsonify({"error": "Lição não encontrada"}), 404

    return jsonify({
        "id": lesson.id,
        "title": lesson.title,
        "description": lesson.description,
        "order": lesson.order_index,
        "exercises": [
            {
                "id": e.id,
                "type": e.exercise_type,
                "question": e.question,
                "difficulty": e.difficulty,
                "hints": e.hints.split(",") if e.hints else [],
                "audio_url": e.audio_url,
                "image_url": e.image_url,
            }
            for e in lesson.exercises
        ],
    }), 200


@bp.route("", methods=["POST"])
def create_course():
    """Criar novo curso (admin only)"""
    data = request.get_json()

    if not all(k in data for k in ["title", "language_from", "language_to"]):
        return jsonify({"error": "Dados incompletos"}), 400

    course = Course(
        title=data["title"],
        description=data.get("description", ""),
        language_from=data["language_from"],
        language_to=data["language_to"],
        difficulty_level=data.get("difficulty_level", "beginner"),
        icon_url=data.get("icon_url", ""),
    )

    db.session.add(course)
    db.session.commit()

    return jsonify({
        "id": course.id,
        "title": course.title,
        "message": "Curso criado com sucesso",
    }), 201
