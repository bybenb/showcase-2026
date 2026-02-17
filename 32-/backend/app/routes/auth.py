"""Autenticação e Rotas de Usuário"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import User

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.route("/register", methods=["POST"])
def register():
    """Registrar novo usuário"""
    data = request.get_json()

    if not data or not all(k in data for k in ["email", "username", "password"]):
        return jsonify({"error": "Dados incompletos"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email já registrado"}), 409

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username já existe"}), 409

    user = User(
        email=data["email"],
        username=data["username"],
        password_hash=generate_password_hash(data["password"]),
        full_name=data.get("full_name", ""),
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "message": "Usuário registrado com sucesso"
    }), 201


@bp.route("/login", methods=["POST"])
def login():
    """Login do usuário"""
    data = request.get_json()

    if not data or not all(k in data for k in ["email", "password"]):
        return jsonify({"error": "Email e senha são obrigatórios"}), 400

    user = User.query.filter_by(email=data["email"]).first()

    if not user or not check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Credenciais inválidas"}), 401

    access_token = create_access_token(identity=user.id)

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "xp": user.xp,
            "level": user.level,
            "streak": user.streak,
        }
    }), 200


@bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Obter dados do usuário autenticado"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404

    return jsonify({
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "xp": user.xp,
        "level": user.level,
        "streak": user.streak,
        "created_at": user.created_at.isoformat(),
    }), 200


@bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Atualizar perfil do usuário"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404

    data = request.get_json()

    if "full_name" in data:
        user.full_name = data["full_name"]
    if "avatar_url" in data:
        user.avatar_url = data["avatar_url"]

    db.session.commit()

    return jsonify({"message": "Perfil atualizado com sucesso"}), 200
