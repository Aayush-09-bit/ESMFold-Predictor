class ProteinStructurePredictor {
    constructor() {
        this.viewer = null;
        this.isSpinning = true;
        this.currentStyle = 'cartoon';
        this.currentPdbString = null;
        this.currentFilename = null;
        
        this.initializeElements();
        this.bindEvents();
        this.updateSequenceLength();
    }

    initializeElements() {
        // Input elements
        this.sequenceInput = document.getElementById('sequenceInput');
        this.sequenceLength = document.getElementById('sequenceLength');
        this.predictButton = document.getElementById('predictButton');
        this.exampleButton = document.getElementById('exampleButton');
        this.clearSequence = document.getElementById('clearSequence');
        
        // Results elements
        this.resultsPanel = document.getElementById('resultsPanel');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        
        // Viewer elements
        this.viewerContainer = document.getElementById('viewer');
        this.confidenceBadge = document.getElementById('confidenceBadge');
        this.confidenceScore = document.getElementById('confidenceScore');
        this.confidenceDescription = document.getElementById('confidenceDescription');
        
        // Control elements
        this.resetViewButton = document.getElementById('resetView');
        this.toggleSpinButton = document.getElementById('toggleSpin');
        this.styleSelect = document.getElementById('styleSelect');
        this.downloadButton = document.getElementById('downloadButton');
    }

    bindEvents() {
        // Input events
        this.sequenceInput.addEventListener('input', () => this.updateSequenceLength());
        this.predictButton.addEventListener('click', () => this.predictStructure());
        this.exampleButton.addEventListener('click', () => this.loadExample());
        this.clearSequence.addEventListener('click', () => this.clearSequenceInput());
        
        // Control events
        this.resetViewButton?.addEventListener('click', () => this.resetView());
        this.toggleSpinButton?.addEventListener('click', () => this.toggleSpin());
        this.styleSelect?.addEventListener('change', (e) => this.changeStyle(e.target.value));
        this.downloadButton?.addEventListener('click', () => this.downloadPdb());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.predictStructure();
                }
            }
        });
    }

    updateSequenceLength() {
        const sequence = this.sequenceInput.value.replace(/\s/g, '');
        this.sequenceLength.textContent = sequence.length;
        
        // Update button state
        const isValid = sequence.length >= 10 && sequence.length <= 1000;
        this.predictButton.disabled = !isValid;
        
        // Color coding for length
        if (sequence.length < 10) {
            this.sequenceLength.style.color = '#e74c3c';
        } else if (sequence.length > 1000) {
            this.sequenceLength.style.color = '#e74c3c';
        } else {
            this.sequenceLength.style.color = '#3498db';
        }
    }

    async predictStructure() {
        const sequence = this.sequenceInput.value.trim();
        
        if (!sequence) {
            this.showError('Please enter a protein sequence');
            return;
        }

        // Validate sequence
        const cleanSequence = sequence.replace(/\s/g, '').toUpperCase();
        const validAA = /^[ACDEFGHIKLMNPQRSTVWY]+$/;
        
        if (!validAA.test(cleanSequence)) {
            this.showError('Invalid amino acid characters found. Please use standard amino acid codes.');
            return;
        }

        if (cleanSequence.length < 10) {
            this.showError('Sequence too short. Minimum 10 amino acids required.');
            return;
        }

        if (cleanSequence.length > 1000) {
            this.showError('Sequence too long. Maximum 1000 amino acids allowed.');
            return;
        }

        // Start prediction
        this.showLoading();
        this.hideError();

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sequence: cleanSequence })
            });

            const result = await response.json();

            if (result.success) {
                this.displayResults(result);
            } else {
                this.showError(result.error || 'Prediction failed');
            }
        } catch (error) {
            console.error('Prediction error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.hideLoading();
        }
    }

    displayResults(result) {
        this.currentPdbString = result.pdb_string;
        this.currentFilename = result.filename;
        
        // Show results panel
        this.resultsPanel.style.display = 'block';
        this.resultsPanel.classList.add('fade-in');
        
        // Update confidence badge
        const confidenceInfo = result.confidence_info;
        this.confidenceScore.textContent = `${result.confidence_score}`;
        this.confidenceBadge.className = `confidence-badge confidence-${confidenceInfo.category.toLowerCase().replace(' ', '-')}`;
        this.confidenceBadge.style.backgroundColor = confidenceInfo.color;
        
        // Update confidence description
        this.confidenceDescription.innerHTML = `
            <strong>pLDDT Score: ${result.confidence_score}</strong><br>
            ${confidenceInfo.description}<br>
            <em>Sequence length: ${result.sequence_length} amino acids</em>
        `;
        
        // Initialize 3D viewer
        this.initialize3DViewer(result.pdb_string);
        
        // Scroll to results
        this.resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    initialize3DViewer(pdbString) {
        // Clear previous viewer
        if (this.viewer) {
            this.viewer.clear();
        }
        
        // Create new viewer
        this.viewer = $3Dmol.createViewer(this.viewerContainer, {
            defaultcolors: $3Dmol.rasmolElementColors
        });
        
        // Add model
        this.viewer.addModel(pdbString, 'pdb');
        
        // Set initial style
        this.setViewerStyle(this.currentStyle);
        
        // Set camera and rendering options
        this.viewer.setBackgroundColor('white');
        this.viewer.zoomTo();
        this.viewer.zoom(1.2);
        
        // Start spinning if enabled
        if (this.isSpinning) {
            this.viewer.spin(true);
        }
        
        // Render
        this.viewer.render();
    }

    setViewerStyle(style) {
        if (!this.viewer) return;
        
        this.viewer.setStyle({}, {}); // Clear all styles
        
        switch (style) {
            case 'cartoon':
                this.viewer.setStyle({}, {
                    cartoon: { color: 'spectrum', thickness: 0.8 }
                });
                break;
            case 'sphere':
                this.viewer.setStyle({}, {
                    sphere: { color: 'spectrum', radius: 0.8 }
                });
                break;
            case 'stick':
                this.viewer.setStyle({}, {
                    stick: { color: 'spectrum', radius: 0.3 }
                });
                break;
            case 'line':
                this.viewer.setStyle({}, {
                    line: { color: 'spectrum' }
                });
                break;
        }
        
        this.viewer.render();
        this.currentStyle = style;
    }

    resetView() {
        if (this.viewer) {
            this.viewer.zoomTo();
            this.viewer.zoom(1.2);
            this.viewer.render();
        }
    }

    toggleSpin() {
        if (this.viewer) {
            this.isSpinning = !this.isSpinning;
            this.viewer.spin(this.isSpinning);
            
            // Update button text
            const icon = this.toggleSpinButton.querySelector('i');
            if (this.isSpinning) {
                icon.className = 'fas fa-pause';
                this.toggleSpinButton.innerHTML = '<i class="fas fa-pause"></i> Stop Spin';
            } else {
                icon.className = 'fas fa-sync-alt';
                this.toggleSpinButton.innerHTML = '<i class="fas fa-sync-alt"></i> Start Spin';
            }
        }
    }

    changeStyle(newStyle) {
        this.setViewerStyle(newStyle);
    }

    async downloadPdb() {
        if (!this.currentFilename) {
            this.showError('No structure available for download');
            return;
        }

        try {
            const response = await fetch(`/download/${this.currentFilename}`);
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = this.currentFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } else {
                this.showError('Download failed. Please try again.');
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Download failed. Please check your connection.');
        }
    }

    loadExample() {
        const exampleSequence = "MGSSHHHHHHSSGLVPRGSHMRGPNPTAASLEASAGPFTVRSFTVSRPSGYGAGTVYYPTNAGGTVGAIAIVPGYTARQSSIKWWGPRLASHGFVVITIDTNSTLDQPSSRSSQQMAALRQVASLNGTSSSPIYGKVDTARMGVMGWSMGGGGSLISAANNPSLKAAAPQAPWDSSTNFSSVTVPTLIFACENDSIAPVNSSALPIYDSMSRNAKQFLEINGGSHSCANSGNSNQALIGKKGVAWMKRFMDNDTRYSTFACENPNSTRVSDFRTANCSLEDPAANKARKEAELAAATAEQ";
        this.sequenceInput.value = exampleSequence;
        this.updateSequenceLength();
        
        // Add visual feedback
        this.sequenceInput.classList.add('slide-up');
        setTimeout(() => {
            this.sequenceInput.classList.remove('slide-up');
        }, 300);
    }

    clearSequenceInput() {
        this.sequenceInput.value = '';
        this.updateSequenceLength();
        this.hideResults();
        this.hideError();
        
        // Focus back to input
        this.sequenceInput.focus();
    }

    showLoading() {
        this.loadingIndicator.style.display = 'block';
        this.predictButton.disabled = true;
        this.predictButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Predicting...';
        this.hideResults();
    }

    hideLoading() {
        this.loadingIndicator.style.display = 'none';
        this.predictButton.disabled = false;
        this.predictButton.innerHTML = '<i class="fas fa-magic"></i> Predict Structure';
    }

    showResults() {
        this.resultsPanel.style.display = 'block';
    }

    hideResults() {
        this.resultsPanel.style.display = 'none';
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'flex';
        this.errorMessage.classList.add('slide-up');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideError();
        }, 10000);
    }

    hideError() {
        this.errorMessage.style.display = 'none';
        this.errorMessage.classList.remove('slide-up');
    }
}

// Utility functions
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function formatSequence(sequence) {
    // Format sequence with line breaks every 50 characters
    return sequence.replace(/(.{50})/g, '$1\n');
}

function validateSequence(sequence) {
    const cleanSeq = sequence.replace(/\s/g, '').toUpperCase();
    const validAA = /^[ACDEFGHIKLMNPQRSTVWY]+$/;
    
    return {
        isValid: validAA.test(cleanSeq) && cleanSeq.length >= 10 && cleanSeq.length <= 1000,
        cleanSequence: cleanSeq,
        length: cleanSeq.length
    };
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Protein Structure Predictor...');
    
    // Check if 3Dmol is loaded
    if (typeof $3Dmol === 'undefined') {
        console.error('3Dmol.js not loaded. Please check the CDN link.');
        return;
    }
    
    // Initialize the main application
    window.proteinPredictor = new ProteinStructurePredictor();
    
    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                smoothScrollTo(target);
            }
        });
    });
    
    // Add loading animation to external links
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.addEventListener('click', function() {
            this.style.opacity = '0.7';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 200);
        });
    });
    
    console.log('Application initialized successfully!');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (window.proteinPredictor && window.proteinPredictor.viewer) {
        if (document.hidden) {
            // Pause spinning when page is hidden
            window.proteinPredictor.viewer.spin(false);
        } else {
            // Resume spinning when page is visible
            if (window.proteinPredictor.isSpinning) {
                window.proteinPredictor.viewer.spin(true);
            }
        }
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    if (window.proteinPredictor && window.proteinPredictor.viewer) {
        // Resize viewer on window resize
        setTimeout(() => {
            window.proteinPredictor.viewer.resize();
            window.proteinPredictor.viewer.render();
        }, 100);
    }
});