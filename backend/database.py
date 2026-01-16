"""Database connection and utilities for HR Platform."""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Any, List
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# VAPID Configuration for Push Notifications
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_SUBJECT = os.environ.get('VAPID_SUBJECT', 'mailto:admin@hrplatform.com')

# Uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads" / "documents"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# ============= MONGODB HELPER FUNCTIONS =============

def clean_mongo_response(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Remove MongoDB _id field from a document to prevent serialization errors."""
    if doc is None:
        return None
    result = {k: v for k, v in doc.items() if k != "_id"}
    return result

def clean_mongo_list(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove MongoDB _id field from a list of documents."""
    return [clean_mongo_response(doc) for doc in docs if doc is not None]
