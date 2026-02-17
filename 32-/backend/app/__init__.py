"""Sayllingo Backend Application"""

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()


def create_app(config=None):
    """Application factory"""
    app = Flask(__name__)

    # Configuração padrão
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///sayllingo.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "seu-secret-key-super-secreto-mude-em-producao"

    # Aplicar config customizada se fornecida
    if config:
        app.config.update(config)

    # Inicializar extensões
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    # Registrar blueprints
    from app.routes import auth, courses, exercises, users

    app.register_blueprint(auth.bp)
    app.register_blueprint(courses.bp)
    app.register_blueprint(exercises.bp)
    app.register_blueprint(users.bp)

    # Criar tabelas
    with app.app_context():
        db.create_all()

    return app
