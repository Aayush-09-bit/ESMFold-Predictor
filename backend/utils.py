import os
import time
from flask import current_app

def save_pdb_file(pdb_string: str, filename: str) -> str:
    """Save PDB string to file and return file path"""
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    
    filepath = os.path.join(upload_folder, filename)
    
    with open(filepath, 'w') as f:
        f.write(pdb_string)
    
    return filepath

def cleanup_old_files(folder: str, max_age_hours: int = 24):
    """Remove files older than specified hours"""
    if not os.path.exists(folder):
        return
    
    current_time = time.time()
    max_age_seconds = max_age_hours * 3600
    
    for filename in os.listdir(folder):
        filepath = os.path.join(folder, filename)
        if os.path.isfile(filepath):
            file_age = current_time - os.path.getctime(filepath)
            if file_age > max_age_seconds:
                try:
                    os.remove(filepath)
                except OSError:
                    pass

def get_confidence_category(score: float) -> dict:
    """Categorize confidence score"""
    # Handle None or invalid scores
    if score is None or not isinstance(score, (int, float)):
        return {"category": "Unknown", "color": "#95a5a6", "description": "Confidence score unavailable"}
    
    if score >= 90:
        return {"category": "Very High", "color": "#2ecc71", "description": "Highly reliable prediction"}
    elif score >= 70:
        return {"category": "High", "color": "#3498db", "description": "Reliable prediction"}
    elif score >= 50:
        return {"category": "Medium", "color": "#f39c12", "description": "Moderately reliable prediction"}
    else:
        return {"category": "Low", "color": "#e74c3c", "description": "Low confidence prediction"}