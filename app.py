from flask import Flask, render_template, request, jsonify, send_file, flash, redirect, url_for
import os
from config import Config
from backend.protein_predictor import ProteinStructurePredictor
from backend.utils import save_pdb_file, cleanup_old_files, get_confidence_category

app = Flask(__name__)
app.config.from_object(Config)

# Initialize predictor
predictor = ProteinStructurePredictor(app.config['ESMATLAS_API_URL'])

# Default sequence
DEFAULT_SEQUENCE = "MGSSHHHHHHSSGLVPRGSHMRGPNPTAASLEASAGPFTVRSFTVSRPSGYGAGTVYYPTNAGGTVGAIAIVPGYTARQSSIKWWGPRLASHGFVVITIDTNSTLDQPSSRSSQQMAALRQVASLNGTSSSPIYGKVDTARMGVMGWSMGGGGSLISAANNPSLKAAAPQAPWDSSTNFSSVTVPTLIFACENDSIAPVNSSALPIYDSMSRNAKQFLEINGGSHSCANSGNSNQALIGKKGVAWMKRFMDNDTRYSTFACENPNSTRVSDFRTANCSLEDPAANKARKEAELAAATAEQ"

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html', default_sequence=DEFAULT_SEQUENCE)

@app.route('/predict', methods=['POST'])
def predict():
    """Handle structure prediction"""
    try:
        data = request.get_json()
        sequence = data.get('sequence', '').strip()
        
        if not sequence:
            return jsonify({"success": False, "error": "No sequence provided"})
        
        # Validate sequence
        is_valid, result = predictor.validate_sequence(sequence)
        if not is_valid:
            return jsonify({"success": False, "error": result})
        
        clean_sequence = result
        
        # Predict structure
        success, prediction_result = predictor.predict_structure(clean_sequence)
        
        if not success:
            return jsonify({"success": False, "error": prediction_result.get("error", "Unknown error")})
        
        # Save PDB file
        filepath = save_pdb_file(
            prediction_result["pdb_string"], 
            prediction_result["filename"]
        )
        
        # Get confidence category (now handles None values)
        confidence_score = prediction_result.get("confidence_score")
        confidence_info = get_confidence_category(confidence_score)
        
        return jsonify({
            "success": True,
            "pdb_string": prediction_result["pdb_string"],
            "confidence_score": confidence_score,
            "confidence_info": confidence_info,
            "filename": prediction_result["filename"],
            "sequence_length": prediction_result["sequence_length"]
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": f"Server error: {str(e)}"})

@app.route('/download/<filename>')
def download_file(filename):
    """Download PDB file"""
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(filepath):
            return send_file(filepath, as_attachment=True, download_name=filename)
        else:
            return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/cleanup')
def cleanup():
    """Clean up old files (can be called via cron job)"""
    cleanup_old_files(app.config['UPLOAD_FOLDER'])
    return jsonify({"message": "Cleanup completed"})

if __name__ == '__main__':
    # Create upload directory if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True, host='0.0.0.0', port=5000)