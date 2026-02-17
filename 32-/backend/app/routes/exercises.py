"""Rotas de Exercícios"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from app import db
from app.models import Exercise, UserAnswer, FSRSState, User
from app.utils.fsrs import calculate_fsrs

bp = Blueprint("exercises", __name__, url_prefix="/api/exercises")


@bp.route("/<exercise_id>/submit", methods=["POST"])
@jwt_required()
def submit_answer(exercise_id):
    """Submeter resposta para um exercício"""
    user_id = get_jwt_identity()
    data = request.get_json()

    exercise = Exercise.query.get(exercise_id)
    if not exercise:
        return jsonify({"error": "Exercício não encontrado"}), 404

    # Registrar a resposta
    is_correct = data.get("answer", "").strip().lower() == exercise.correct_answer.strip().lower()

    answer = UserAnswer(
        user_id=user_id,
        exercise_id=exercise_id,
        answer=data.get("answer", ""),
        is_correct=is_correct,
        response_time=data.get("response_time", 0),
        difficulty_rating=data.get("difficulty_rating", 3),
    )

    db.session.add(answer)

    # Atualizar ou criar estado FSRS
    fsrs = FSRSState.query.filter_by(user_id=user_id, exercise_id=exercise_id).first()

    if not fsrs:
        fsrs = FSRSState(
            user_id=user_id,
            exercise_id=exercise_id,
        )
        db.session.add(fsrs)

    # Calcular novo estado FSRS
    rating = 4 if is_correct else 1  # 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
    new_state = calculate_fsrs(fsrs, rating)

    fsrs.stability = new_state["stability"]
    fsrs.difficulty = new_state["difficulty"]
    fsrs.elapsed_days = new_state["elapsed_days"]
    fsrs.scheduled_days = new_state["scheduled_days"]
    fsrs.reps = new_state["reps"]
    fsrs.lapses = new_state["lapses"]
    fsrs.state = new_state["state"]
    fsrs.last_review = datetime.utcnow()
    fsrs.next_review = new_state["next_review"]

    # Atualizar XP do usuário se resposta correta
    user = User.query.get(user_id)
    if is_correct:
        xp_gained = 10 + (exercise.difficulty * 5)
        user.xp += xp_gained
    else:
        xp_gained = 0

    db.session.commit()

    return jsonify({
        "is_correct": is_correct,
        "xp_gained": xp_gained,
        "correct_answer": exercise.correct_answer,
        "feedback": "Parabéns!" if is_correct else "Tente novamente",
        "next_review": fsrs.next_review.isoformat() if fsrs.next_review else None,
    }), 200


@bp.route("/review-queue", methods=["GET"])
@jwt_required()
def get_review_queue():
    """Obter exercícios que precisam ser revisados"""
    user_id = get_jwt_identity()

    # Buscar exercícios cuja próxima revisão é agora ou no passado
    fsrs_states = FSRSState.query.filter(
        FSRSState.user_id == user_id,
        FSRSState.next_review <= datetime.utcnow(),
    ).order_by(FSRSState.next_review).limit(10).all()

    return jsonify([
        {
            "exercise_id": f.exercise_id,
            "exercise_type": f.exercise.exercise_type,
            "question": f.exercise.question,
            "difficulty": f.exercise.difficulty,
            "state": f.state,
            "stability": round(f.stability, 2),
            "next_review": f.next_review.isoformat() if f.next_review else None,
        }
        for f in fsrs_states
    ]), 200


@bp.route("/new-queue", methods=["GET"])
@jwt_required()
def get_new_exercises():
    """Obter novos exercícios não iniciados"""
    user_id = get_jwt_identity()

    # Buscar exercícios que o usuário ainda não viu
    existing_fsrs = FSRSState.query.filter_by(user_id=user_id).with_entities(FSRSState.exercise_id).all()
    existing_ids = [e[0] for e in existing_fsrs]

    new_exercises = Exercise.query.filter(~Exercise.id.in_(existing_ids)).limit(10).all()

    return jsonify([
        {
            "exercise_id": e.id,
            "exercise_type": e.exercise_type,
            "question": e.question,
            "difficulty": e.difficulty,
            "hints": e.hints.split(",") if e.hints else [],
            "audio_url": e.audio_url,
            "image_url": e.image_url,
        }
        for e in new_exercises
    ]), 200
