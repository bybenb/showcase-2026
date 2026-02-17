"""Rotas de Usuários"""

from flask import Blueprint, jsonify
from flask_jwt_required import jwt_required, get_jwt_identity
from app.models import User, UserProgress
from app import db

bp = Blueprint("users", __name__, url_prefix="/api/users")


@bp.route("/<user_id>/stats", methods=["GET"])
def get_user_stats(user_id):
    """Obter estatísticas do usuário"""
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404

    progress_records = UserProgress.query.filter_by(user_id=user_id).all()

    return jsonify({
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "xp": user.xp,
        "level": user.level,
        "streak": user.streak,
        "courses_enrolled": len(progress_records),
        "created_at": user.created_at.isoformat(),
    }), 200


@bp.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    """Obter ranking de usuários por XP"""
    users = User.query.order_by(User.xp.desc()).limit(100).all()

    return jsonify([
        {
            "rank": i + 1,
            "username": u.username,
            "xp": u.xp,
            "level": u.level,
            "avatar_url": u.avatar_url,
        }
        for i, u in enumerate(users)
    ]), 200


@bp.route("/me/progress", methods=["GET"])
@jwt_required()
def get_user_progress():
    """Obter progresso de todos os cursos do usuário"""
    user_id = get_jwt_identity()
    progress = UserProgress.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            "course_id": p.course_id,
            "course_title": p.course.title if p.course else "Desconhecido",
            "xp_earned": p.xp_earned,
            "level": p.level,
            "last_activity": p.last_activity.isoformat() if p.last_activity else None,
        }
        for p in progress
    ]), 200
