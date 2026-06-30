import firebase_admin
from firebase_admin import credentials, firestore
import os

# Resolve the backend directory regardless of where the server is launched from
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def _resolve_cred_path(cred_path: str) -> str:
    """Resolve a credential path that may be relative (e.g. ./serviceAccountKey.json).
    If the path doesn't exist as-is, try resolving it relative to the backend directory."""
    if os.path.isabs(cred_path):
        return cred_path
    if os.path.exists(cred_path):
        return cred_path
    # Try relative to the backend directory
    backend_relative = os.path.join(_BACKEND_DIR, cred_path.lstrip('./').lstrip('.\\'))
    if os.path.exists(backend_relative):
        return backend_relative
    return cred_path  # Return original and let firebase_admin report the error

def initialize_firebase():
    # If running on GCP (Cloud Run), default credentials work automatically.
    # For local development, check if GOOGLE_APPLICATION_CREDENTIALS is set
    try:
        if not firebase_admin._apps:
            # Check for raw JSON string first (ideal for external PaaS hosting)
            service_account_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
            if service_account_json:
                import json
                cred_info = json.loads(service_account_json)
                cred = credentials.Certificate(cred_info)
                firebase_admin.initialize_app(cred)
            else:
                # Check for local creds file
                cred_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
                if cred_path:
                    resolved = _resolve_cred_path(cred_path)
                    if os.path.exists(resolved):
                        cred = credentials.Certificate(resolved)
                        firebase_admin.initialize_app(cred)
                    else:
                        # Fall back to Application Default Credentials
                        try:
                            firebase_admin.initialize_app()
                        except Exception as e:
                            print("Could not initialize Firebase via Application Default Credentials. Using mock DB.")
                            return None
                else:
                    # No env var set — try Application Default Credentials
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
