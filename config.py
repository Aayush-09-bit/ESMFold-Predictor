import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    ESMATLAS_API_URL = 'https://api.esmatlas.com/foldSequence/v1/pdb/'
    MAX_SEQUENCE_LENGTH = 1000
    UPLOAD_FOLDER = 'static/downloads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size