from flask import Flask, send_from_directory
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from extensions import db, jwt, mail
from config import Config
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ── Initialize Extensions ────────────────────────────────
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ── Register Blueprints (API Routes) ─────────────────────
    from routes.auth    import auth_bp
    from routes.admin   import admin_bp
    from routes.company import company_bp
    from routes.student import student_bp

    app.register_blueprint(auth_bp,    url_prefix='/api/auth')
    app.register_blueprint(admin_bp,   url_prefix='/api/admin')
    app.register_blueprint(company_bp, url_prefix='/api/company')
    app.register_blueprint(student_bp, url_prefix='/api/student')

    # ── Serve Vue Frontend ───────────────────────────────────
    @app.route('/')
    def serve_frontend():
        return send_from_directory('../frontend', 'index.html')

    # ── Create DB Tables + Seed Admin ───────────────────────
    with app.app_context():
        db.create_all()
        seed_admin(app)

    return app


def seed_admin(app):
    """Create admin user if doesn't exist"""
    from models import User
    from config import Config

    admin = User.query.filter_by(role='admin').first()
    if not admin:
        admin = User(email=Config.ADMIN_EMAIL, role='admin', is_active=True)
        admin.set_password(Config.ADMIN_PASSWORD)
        db.session.add(admin)
        db.session.commit()
        print(f"✅ Admin created: {Config.ADMIN_EMAIL} / {Config.ADMIN_PASSWORD}")
    else:
        print("✅ Admin already exists")


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)