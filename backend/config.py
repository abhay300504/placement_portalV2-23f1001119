import os

class Config:
    # Database
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(BASE_DIR, 'placement.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT 
    JWT_SECRET_KEY = 'your-super-secret-key-change-this'  # Change in production

    #  Redis & Celery
    REDIS_URL = 'redis://localhost:6379/0'
    CELERY_BROKER_URL = 'redis://localhost:6379/0'
    CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'

    # Mail (Gmail example)
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = 'abhay@gmial.com'  
    MAIL_PASSWORD = '122345'           
    MAIL_DEFAULT_SENDER = 'your-email@gmail.com'

    # File Uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB max resume size

    # Cache (Redis)
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = 'redis://localhost:6379/1'
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes

    # Admin Credentials (pre-seeded)
    ADMIN_EMAIL = 'admin@institute.com'
    ADMIN_PASSWORD = 'admin123'