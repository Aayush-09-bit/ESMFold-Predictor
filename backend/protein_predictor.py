import requests
import biotite.structure.io as bsio
import os
import tempfile
from typing import Tuple, Optional

class ProteinStructurePredictor:
    def __init__(self, api_url: str):
        self.api_url = api_url
    
    def validate_sequence(self, sequence: str) -> Tuple[bool, str]:
        """Validate protein sequence"""
        if not sequence or len(sequence.strip()) == 0:
            return False, "Sequence cannot be empty"
        
        # Remove whitespace and convert to uppercase
        clean_sequence = ''.join(sequence.split()).upper()
        
        # Check for valid amino acid characters
        valid_aa = set('ACDEFGHIKLMNPQRSTVWY')
        if not all(aa in valid_aa for aa in clean_sequence):
            return False, "Invalid amino acid characters found"
        
        if len(clean_sequence) < 10:
            return False, "Sequence too short (minimum 10 amino acids)"
        
        if len(clean_sequence) > 1000:
            return False, "Sequence too long (maximum 1000 amino acids)"
        
        return True, clean_sequence
    
    def predict_structure(self, sequence: str) -> Tuple[bool, dict]:
        """Predict protein structure using ESMFold API"""
        try:
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
            
            response = requests.post(
                self.api_url, 
                headers=headers, 
                data=sequence,
                timeout=300  # 5 minutes timeout
            )
            
            if response.status_code != 200:
                return False, {"error": f"API error: {response.status_code}"}
            
            pdb_string = response.content.decode('utf-8')
            
            # Calculate confidence score
            confidence_score = self._calculate_plddt(pdb_string)
            
            # Generate filename based on sequence
            filename = f"{sequence[:3]}{sequence[-3:]}_{hash(sequence) % 10000}.pdb"
            
            return True, {
                "pdb_string": pdb_string,
                "confidence_score": confidence_score,
                "filename": filename,
                "sequence_length": len(sequence)
            }
            
        except requests.exceptions.Timeout:
            return False, {"error": "Request timeout - sequence may be too long"}
        except Exception as e:
            return False, {"error": f"Prediction failed: {str(e)}"}
    
    def _calculate_plddt(self, pdb_string: str) -> Optional[float]:
        """Calculate average pLDDT score from PDB string"""
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.pdb', delete=False) as tmp_file:
                tmp_file.write(pdb_string)
                tmp_file.flush()
                
                struct = bsio.load_structure(tmp_file.name, extra_fields=["b_factor"])
                confidence_score = round(struct.b_factor.mean(), 4)
                
                # Clean up temp file
                os.unlink(tmp_file.name)
                
                return confidence_score
        except Exception:
            return None