# ESMFold Predictor
A web application for predicting protein 3D structures from amino acid sequences using Meta AI's ESMFold algorithm.

![Protein Structure Predictor](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## Features
- 🧬 AI-powered protein structure prediction
- 🎨 Interactive 3D visualization
- 📊 Confidence scoring (pLDDT)
- 💾 PDB file download
- 📱 Mobile-responsive design

## Quick Start

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application**
   ```bash
   python app.py
   ```

3. **Open browser**
   ```
   http://localhost:5000
   ```

## Usage
1. Enter your protein amino acid sequence (10-1000 residues)
2. Click "Predict Structure" 
3. View the interactive 3D structure
4. Download the PDB file if needed

## Example Sequence
```
MGSSHHHHHHSSGLVPRGSHMRGPNPTAASLEASAGPFTVRSFTVSRPSGYGAGTVYYPTNAGGTVGAIAIVPGYTARQSSIKWWGPRLASHGFVVITIDTNSTLDQPSSRSSQQMAALRQVASLNGTSSSPIYGKVDTARMGVMGWSMGGGGSLISAANNPSLKAAAPQAPWDSSTNFSSVTVPTLIFACENDSIAPVNSSALPIYDSMSRNAKQFLEINGGSHSCANSGNSNQALIGKKGVAWMKRFMDNDTRYSTFACENPNSTRVSDFRTANCSLEDPAANKARKEAELAAATAEQ
```

## Tech Stack
- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript
- **Visualization**: 3Dmol.js
- **API**: ESMFold Atlas

## Project Structure
```
├── app.py                # Main Flask application
├── config.py             # Configuration
├── backend/              # Backend logic
├── static/               # CSS, JS, downloads
├── templates/            # HTML templates
└── tests/                # Unit tests
```

## Requirements
- Python 3.8+
- Internet connection (for ESMFold API)

## License
MIT License

## About ESMFold
ESMFold is Meta AI's protein structure prediction model, providing fast and accurate predictions without the need for multiple sequence alignments.

