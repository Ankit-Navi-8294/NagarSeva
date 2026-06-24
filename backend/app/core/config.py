import firebase_admin
from firebase_admin import credentials, firestore
import os

def initialize_firebase():
    # If running on GCP (Cloud Run), default credentials work automatically.
    # For local development, check if GOOGLE_APPLICATION_CREDENTIALS is set
    try:
        if not firebase_admin._apps:
            # Check for local creds file
            cred_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                # Mock or Application Default Credentials
                try:
                    firebase_admin.initialize_app()
                except Exception as e:
                    print("Could not initialize Firebase via Application Default Credentials. Using mock DB.")
                    return None
        
        return firestore.client()
    except Exception as e:
        print(f"Firebase Init Error: {e}")
        return None

db = initialize_firebase()
