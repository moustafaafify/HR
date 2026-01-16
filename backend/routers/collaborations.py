"""Collaborations Router - Central Hub for Team Communication & Productivity."""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict
import uuid
import os
import shutil
from pathlib import Path

import sys
sys.path.insert(0, '/app/backend')
from database import db
from auth import get_current_user
from models.core import User, UserRole

router = APIRouter(prefix="/collaborations", tags=["Collaborations"])

# Uploads directory for collaboration files
COLLAB_UPLOADS_DIR = Path("/app/backend/uploads/collaborations")
COLLAB_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


# ============= MODELS =============

class Channel(BaseModel):
    """Communication channel/workspace"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    type: str = "public"  # public, private, direct
    icon: Optional[str] = None  # emoji or icon name
    color: Optional[str] = "#6366f1"
    
    # Members (for private channels and DMs)
    members: List[str] = Field(default_factory=list)  # user IDs
    
    # Settings
    is_archived: bool = False
    allow_threads: bool = True
    allow_reactions: bool = True
    allow_file_uploads: bool = True
    
    # Metadata
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_message_at: Optional[str] = None
    message_count: int = 0


class Message(BaseModel):
    """Chat message in a channel"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channel_id: str
    
    # Content
    content: str
    content_type: str = "text"  # text, file, image, link, system
    
    # Sender
    sender_id: str
    sender_name: Optional[str] = None
    sender_avatar: Optional[str] = None
    
    # Thread
    parent_id: Optional[str] = None  # For thread replies
    thread_count: int = 0
    
    # Attachments
    attachments: List[Dict[str, Any]] = Field(default_factory=list)
    # [{id, name, url, type, size}]
    
    # Mentions
    mentions: List[str] = Field(default_factory=list)  # user IDs
    
    # Reactions
    reactions: Dict[str, List[str]] = Field(default_factory=dict)
    # {"👍": ["user1", "user2"], "❤️": ["user3"]}
    
    # Status
    is_pinned: bool = False
    is_edited: bool = False
    is_deleted: bool = False
    edited_at: Optional[str] = None
    
    # Metadata
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class SavedItem(BaseModel):
    """Bookmarked/saved message or file"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    item_type: str  # message, file
    item_id: str
    channel_id: str
    note: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CollabFile(BaseModel):
    """Shared file in collaboration"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channel_id: Optional[str] = None
    message_id: Optional[str] = None
    
    name: str
    original_name: str
    file_type: str  # document, image, video, audio, other
    mime_type: Optional[str] = None
    size: int = 0
    url: str
    
    uploaded_by: str
    uploaded_by_name: Optional[str] = None
    
    # Metadata
    downloads: int = 0
    is_deleted: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Integration(BaseModel):
    """Third-party integration/app"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    type: str  # webhook, bot, app
    
    # Configuration
    webhook_url: Optional[str] = None
    api_key: Optional[str] = None
    settings: Dict[str, Any] = Field(default_factory=dict)
    
    # Channels where active
    channel_ids: List[str] = Field(default_factory=list)
    
    # Status
    is_active: bool = True
    
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Task(BaseModel):
    """Task/to-do item in collaboration"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channel_id: Optional[str] = None
    message_id: Optional[str] = None  # Task created from message
    
    title: str
    description: Optional[str] = None
    
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    
    due_date: Optional[str] = None
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "todo"  # todo, in_progress, done
    
    tags: List[str] = Field(default_factory=list)
    
    created_by: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None


class Poll(BaseModel):
    """Poll in a channel"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channel_id: str
    message_id: Optional[str] = None
    
    question: str
    options: List[Dict[str, Any]] = Field(default_factory=list)
    # [{"id": "opt1", "text": "Option 1", "votes": ["user1", "user2"]}]
    
    allow_multiple: bool = False
    is_anonymous: bool = False
    ends_at: Optional[str] = None
    is_closed: bool = False
    
    created_by: str
    created_by_name: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class UserStatus(BaseModel):
    """User presence/status"""
    model_config = ConfigDict(extra="ignore")
    user_id: str
    status: str = "online"  # online, away, dnd, offline
    status_text: Optional[str] = None  # Custom status message
    status_emoji: Optional[str] = None  # Custom emoji
    clear_at: Optional[str] = None  # When to auto-clear status
    last_active: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ChannelCategory(BaseModel):
    """Category/folder for organizing channels"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    order: int = 0
    is_collapsed: bool = False
    created_by: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class QuickReply(BaseModel):
    """Quick reply template"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    content: str
    shortcut: Optional[str] = None  # e.g., "/thanks"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReadReceipt(BaseModel):
    """Track read status per user per channel"""
    model_config = ConfigDict(extra="ignore")
    user_id: str
    channel_id: str
    last_read_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_read_message_id: Optional[str] = None


class NotificationPreference(BaseModel):
    """Per-channel notification settings"""
    model_config = ConfigDict(extra="ignore")
    user_id: str
    channel_id: str
    muted: bool = False
    mute_until: Optional[str] = None
    notify_all: bool = True
    notify_mentions: bool = True
    notify_replies: bool = True


# ============= HELPER FUNCTIONS =============

def get_file_type(filename: str) -> str:
    """Determine file type from extension"""
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    
    image_exts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
    doc_exts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv']
    video_exts = ['mp4', 'mov', 'avi', 'mkv', 'webm']
    audio_exts = ['mp3', 'wav', 'ogg', 'flac', 'm4a']
    
    if ext in image_exts:
        return 'image'
    elif ext in doc_exts:
        return 'document'
    elif ext in video_exts:
        return 'video'
    elif ext in audio_exts:
        return 'audio'
    return 'other'


async def get_user_info(user_id: str) -> Dict[str, Any]:
    """Get basic user info for display"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if user:
        return {
            "id": user.get("id"),
            "name": user.get("full_name", "Unknown"),
            "email": user.get("email"),
            "avatar": None  # Could add profile picture
        }
    return {"id": user_id, "name": "Unknown User", "email": None, "avatar": None}


# ============= CHANNEL ROUTES =============

@router.get("/channels")
async def get_channels(
    include_archived: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Get all channels accessible to user"""
    query = {}
    if not include_archived:
        query["is_archived"] = False
    
    # Get public channels and private channels user is member of
    channels = await db.collab_channels.find({
        "$and": [
            query,
            {"$or": [
                {"type": "public"},
                {"members": current_user.id},
                {"created_by": current_user.id}
            ]}
        ]
    }, {"_id": 0}).sort("last_message_at", -1).to_list(100)
    
    return channels


@router.post("/channels")
async def create_channel(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new channel"""
    channel = Channel(
        **data,
        created_by=current_user.id,
        members=[current_user.id] + data.get("members", [])
    )
    
    await db.collab_channels.insert_one(channel.model_dump())
    
    # Create system message
    system_msg = Message(
        channel_id=channel.id,
        content=f"{current_user.full_name} created #{channel.name}",
        content_type="system",
        sender_id=current_user.id,
        sender_name=current_user.full_name
    )
    await db.collab_messages.insert_one(system_msg.model_dump())
    
    return channel.model_dump()


@router.get("/channels/{channel_id}")
async def get_channel(channel_id: str, current_user: User = Depends(get_current_user)):
    """Get channel details"""
    channel = await db.collab_channels.find_one({"id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Check access
    if channel["type"] == "private" and current_user.id not in channel.get("members", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return channel


@router.put("/channels/{channel_id}")
async def update_channel(
    channel_id: str, 
    data: Dict[str, Any], 
    current_user: User = Depends(get_current_user)
):
    """Update channel settings"""
    channel = await db.collab_channels.find_one({"id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Only creator or admin can update
    if channel["created_by"] != current_user.id and current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only channel creator can update")
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.collab_channels.update_one({"id": channel_id}, {"$set": data})
    
    return await db.collab_channels.find_one({"id": channel_id}, {"_id": 0})


@router.delete("/channels/{channel_id}")
async def delete_channel(channel_id: str, current_user: User = Depends(get_current_user)):
    """Archive a channel"""
    channel = await db.collab_channels.find_one({"id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if channel["created_by"] != current_user.id and current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only channel creator can archive")
    
    await db.collab_channels.update_one(
        {"id": channel_id}, 
        {"$set": {"is_archived": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Channel archived"}


@router.post("/channels/{channel_id}/members")
async def add_channel_member(
    channel_id: str, 
    data: Dict[str, Any], 
    current_user: User = Depends(get_current_user)
):
    """Add member to private channel"""
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    await db.collab_channels.update_one(
        {"id": channel_id},
        {"$addToSet": {"members": user_id}}
    )
    
    # System message
    user_info = await get_user_info(user_id)
    system_msg = Message(
        channel_id=channel_id,
        content=f"{user_info['name']} was added to the channel",
        content_type="system",
        sender_id=current_user.id,
        sender_name=current_user.full_name
    )
    await db.collab_messages.insert_one(system_msg.model_dump())
    
    return {"message": "Member added"}


@router.delete("/channels/{channel_id}/members/{user_id}")
async def remove_channel_member(
    channel_id: str, 
    user_id: str, 
    current_user: User = Depends(get_current_user)
):
    """Remove member from channel"""
    await db.collab_channels.update_one(
        {"id": channel_id},
        {"$pull": {"members": user_id}}
    )
    
    return {"message": "Member removed"}


# ============= MESSAGE ROUTES =============

@router.get("/channels/{channel_id}/messages")
async def get_messages(
    channel_id: str,
    limit: int = 50,
    before: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get messages in a channel"""
    query = {"channel_id": channel_id, "is_deleted": False, "parent_id": None}
    
    if before:
        query["created_at"] = {"$lt": before}
    
    messages = await db.collab_messages.find(
        query, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    # Reverse to get chronological order
    messages.reverse()
    
    return messages


@router.post("/channels/{channel_id}/messages")
async def send_message(
    channel_id: str,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Send a message to a channel"""
    # Extract mentions from content
    mentions = []
    content = data.get("content", "")
    
    message = Message(
        channel_id=channel_id,
        content=content,
        content_type=data.get("content_type", "text"),
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        parent_id=data.get("parent_id"),
        mentions=data.get("mentions", []),
        attachments=data.get("attachments", [])
    )
    
    await db.collab_messages.insert_one(message.model_dump())
    
    # Update channel last message time and count
    await db.collab_channels.update_one(
        {"id": channel_id},
        {
            "$set": {"last_message_at": message.created_at},
            "$inc": {"message_count": 1}
        }
    )
    
    # If this is a thread reply, update parent
    if message.parent_id:
        await db.collab_messages.update_one(
            {"id": message.parent_id},
            {"$inc": {"thread_count": 1}}
        )
    
    return message.model_dump()


@router.get("/messages/{message_id}/thread")
async def get_thread(message_id: str, current_user: User = Depends(get_current_user)):
    """Get thread replies for a message"""
    # Get parent message
    parent = await db.collab_messages.find_one({"id": message_id}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Get replies
    replies = await db.collab_messages.find(
        {"parent_id": message_id, "is_deleted": False},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    return {"parent": parent, "replies": replies}


@router.put("/messages/{message_id}")
async def edit_message(
    message_id: str, 
    data: Dict[str, Any], 
    current_user: User = Depends(get_current_user)
):
    """Edit a message"""
    message = await db.collab_messages.find_one({"id": message_id}, {"_id": 0})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message["sender_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Can only edit your own messages")
    
    await db.collab_messages.update_one(
        {"id": message_id},
        {"$set": {
            "content": data.get("content", message["content"]),
            "is_edited": True,
            "edited_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return await db.collab_messages.find_one({"id": message_id}, {"_id": 0})


@router.delete("/messages/{message_id}")
async def delete_message(message_id: str, current_user: User = Depends(get_current_user)):
    """Delete a message"""
    message = await db.collab_messages.find_one({"id": message_id}, {"_id": 0})
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    if message["sender_id"] != current_user.id and current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Can only delete your own messages")
    
    await db.collab_messages.update_one(
        {"id": message_id},
        {"$set": {"is_deleted": True, "content": "This message was deleted"}}
    )
    
    return {"message": "Message deleted"}


@router.post("/messages/{message_id}/reactions")
async def add_reaction(
    message_id: str, 
    data: Dict[str, Any], 
    current_user: User = Depends(get_current_user)
):
    """Add reaction to a message"""
    emoji = data.get("emoji")
    if not emoji:
        raise HTTPException(status_code=400, detail="emoji required")
    
    # Add user to reaction
    await db.collab_messages.update_one(
        {"id": message_id},
        {"$addToSet": {f"reactions.{emoji}": current_user.id}}
    )
    
    return {"message": "Reaction added"}


@router.delete("/messages/{message_id}/reactions/{emoji}")
async def remove_reaction(
    message_id: str, 
    emoji: str, 
    current_user: User = Depends(get_current_user)
):
    """Remove reaction from a message"""
    await db.collab_messages.update_one(
        {"id": message_id},
        {"$pull": {f"reactions.{emoji}": current_user.id}}
    )
    
    return {"message": "Reaction removed"}


@router.post("/messages/{message_id}/pin")
async def pin_message(message_id: str, current_user: User = Depends(get_current_user)):
    """Pin a message"""
    await db.collab_messages.update_one(
        {"id": message_id},
        {"$set": {"is_pinned": True}}
    )
    return {"message": "Message pinned"}


@router.delete("/messages/{message_id}/pin")
async def unpin_message(message_id: str, current_user: User = Depends(get_current_user)):
    """Unpin a message"""
    await db.collab_messages.update_one(
        {"id": message_id},
        {"$set": {"is_pinned": False}}
    )
    return {"message": "Message unpinned"}


@router.get("/channels/{channel_id}/pinned")
async def get_pinned_messages(channel_id: str, current_user: User = Depends(get_current_user)):
    """Get pinned messages in a channel"""
    messages = await db.collab_messages.find(
        {"channel_id": channel_id, "is_pinned": True, "is_deleted": False},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return messages


# ============= FILE ROUTES =============

@router.post("/channels/{channel_id}/files")
async def upload_file(
    channel_id: str,
    file: UploadFile = File(...),
    message_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Upload a file to a channel"""
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else ''
    unique_name = f"{uuid.uuid4()}.{ext}" if ext else str(uuid.uuid4())
    
    # Save file
    file_path = COLLAB_UPLOADS_DIR / unique_name
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Create file record
    collab_file = CollabFile(
        channel_id=channel_id,
        message_id=message_id,
        name=unique_name,
        original_name=file.filename,
        file_type=get_file_type(file.filename),
        mime_type=file.content_type,
        size=len(content),
        url=f"/uploads/collaborations/{unique_name}",
        uploaded_by=current_user.id,
        uploaded_by_name=current_user.full_name
    )
    
    await db.collab_files.insert_one(collab_file.model_dump())
    
    return collab_file.model_dump()


@router.get("/channels/{channel_id}/files")
async def get_channel_files(
    channel_id: str,
    file_type: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get files shared in a channel"""
    query = {"channel_id": channel_id, "is_deleted": False}
    if file_type:
        query["file_type"] = file_type
    
    files = await db.collab_files.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return files


@router.get("/files")
async def get_all_files(
    file_type: Optional[str] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """Get all files accessible to user"""
    query = {"is_deleted": False}
    if file_type:
        query["file_type"] = file_type
    
    files = await db.collab_files.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return files


# ============= SEARCH ROUTES =============

@router.get("/search")
async def search(
    q: str,
    type: Optional[str] = None,  # messages, files, channels
    channel_id: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Search messages, files, and channels"""
    results = {"messages": [], "files": [], "channels": []}
    
    if not type or type == "messages":
        msg_query = {"content": {"$regex": q, "$options": "i"}, "is_deleted": False}
        if channel_id:
            msg_query["channel_id"] = channel_id
        
        results["messages"] = await db.collab_messages.find(
            msg_query, {"_id": 0}
        ).sort("created_at", -1).to_list(limit)
    
    if not type or type == "files":
        file_query = {"original_name": {"$regex": q, "$options": "i"}, "is_deleted": False}
        if channel_id:
            file_query["channel_id"] = channel_id
        
        results["files"] = await db.collab_files.find(
            file_query, {"_id": 0}
        ).sort("created_at", -1).to_list(limit)
    
    if not type or type == "channels":
        results["channels"] = await db.collab_channels.find(
            {"$or": [
                {"name": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}}
            ], "is_archived": False},
            {"_id": 0}
        ).to_list(limit)
    
    return results


# ============= SAVED ITEMS ROUTES =============

@router.get("/saved")
async def get_saved_items(current_user: User = Depends(get_current_user)):
    """Get user's saved/bookmarked items"""
    items = await db.collab_saved.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with actual content
    enriched = []
    for item in items:
        if item["item_type"] == "message":
            message = await db.collab_messages.find_one({"id": item["item_id"]}, {"_id": 0})
            if message:
                item["content"] = message
        elif item["item_type"] == "file":
            file = await db.collab_files.find_one({"id": item["item_id"]}, {"_id": 0})
            if file:
                item["content"] = file
        enriched.append(item)
    
    return enriched


@router.post("/saved")
async def save_item(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Save/bookmark an item"""
    saved = SavedItem(
        user_id=current_user.id,
        item_type=data.get("item_type"),
        item_id=data.get("item_id"),
        channel_id=data.get("channel_id"),
        note=data.get("note")
    )
    
    await db.collab_saved.insert_one(saved.model_dump())
    return saved.model_dump()


@router.delete("/saved/{item_id}")
async def unsave_item(item_id: str, current_user: User = Depends(get_current_user)):
    """Remove saved item"""
    await db.collab_saved.delete_one({"id": item_id, "user_id": current_user.id})
    return {"message": "Item removed from saved"}


# ============= TASK ROUTES =============

@router.get("/tasks")
async def get_tasks(
    status: Optional[str] = None,
    assignee_id: Optional[str] = None,
    channel_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get tasks"""
    query = {}
    if status:
        query["status"] = status
    if assignee_id:
        query["assignee_id"] = assignee_id
    if channel_id:
        query["channel_id"] = channel_id
    
    # If not admin, only show tasks assigned to user or created by user
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        query["$or"] = [
            {"assignee_id": current_user.id},
            {"created_by": current_user.id}
        ]
    
    tasks = await db.collab_tasks.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tasks


@router.post("/tasks")
async def create_task(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a task"""
    # Get assignee name
    assignee_name = None
    if data.get("assignee_id"):
        user_info = await get_user_info(data["assignee_id"])
        assignee_name = user_info.get("name")
    
    task = Task(
        **data,
        assignee_name=assignee_name,
        created_by=current_user.id
    )
    
    await db.collab_tasks.insert_one(task.model_dump())
    return task.model_dump()


@router.put("/tasks/{task_id}")
async def update_task(
    task_id: str, 
    data: Dict[str, Any], 
    current_user: User = Depends(get_current_user)
):
    """Update a task"""
    # If completing task
    if data.get("status") == "done":
        data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update assignee name if changed
    if "assignee_id" in data:
        if data["assignee_id"]:
            user_info = await get_user_info(data["assignee_id"])
            data["assignee_name"] = user_info.get("name")
        else:
            data["assignee_name"] = None
    
    await db.collab_tasks.update_one({"id": task_id}, {"$set": data})
    return await db.collab_tasks.find_one({"id": task_id}, {"_id": 0})


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: User = Depends(get_current_user)):
    """Delete a task"""
    await db.collab_tasks.delete_one({"id": task_id})
    return {"message": "Task deleted"}


# ============= DIRECT MESSAGES =============

@router.post("/dm")
async def create_direct_message(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create or get direct message channel with a user"""
    other_user_id = data.get("user_id")
    if not other_user_id:
        raise HTTPException(status_code=400, detail="user_id required")
    
    # Check if DM channel already exists
    existing = await db.collab_channels.find_one({
        "type": "direct",
        "members": {"$all": [current_user.id, other_user_id], "$size": 2}
    }, {"_id": 0})
    
    if existing:
        return existing
    
    # Get other user info
    other_user = await get_user_info(other_user_id)
    
    # Create new DM channel
    channel = Channel(
        name=f"DM: {current_user.full_name} & {other_user['name']}",
        type="direct",
        members=[current_user.id, other_user_id],
        created_by=current_user.id
    )
    
    await db.collab_channels.insert_one(channel.model_dump())
    return channel.model_dump()


@router.get("/dm")
async def get_direct_messages(current_user: User = Depends(get_current_user)):
    """Get all direct message channels for user"""
    channels = await db.collab_channels.find(
        {"type": "direct", "members": current_user.id, "is_archived": False},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(50)
    
    # Enrich with other user info
    enriched = []
    for channel in channels:
        other_id = [m for m in channel["members"] if m != current_user.id]
        if other_id:
            other_info = await get_user_info(other_id[0])
            channel["other_user"] = other_info
        enriched.append(channel)
    
    return enriched


# ============= DASHBOARD/STATS =============

@router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    """Get collaboration dashboard stats"""
    # Count channels
    total_channels = await db.collab_channels.count_documents({"is_archived": False, "type": {"$ne": "direct"}})
    
    # Count messages today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    messages_today = await db.collab_messages.count_documents({
        "created_at": {"$gte": today_start},
        "is_deleted": False
    })
    
    # Count files
    total_files = await db.collab_files.count_documents({"is_deleted": False})
    
    # Count active users (sent message in last 7 days)
    week_ago = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = (week_ago - timedelta(days=7)).isoformat()
    
    active_users = await db.collab_messages.distinct("sender_id", {
        "created_at": {"$gte": week_ago}
    })
    
    # User's tasks
    my_tasks = await db.collab_tasks.count_documents({
        "assignee_id": current_user.id,
        "status": {"$ne": "done"}
    })
    
    # Recent activity
    recent_messages = await db.collab_messages.find(
        {"is_deleted": False, "content_type": {"$ne": "system"}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    
    return {
        "total_channels": total_channels,
        "messages_today": messages_today,
        "total_files": total_files,
        "active_users": len(active_users),
        "my_pending_tasks": my_tasks,
        "recent_activity": recent_messages
    }


# ============= USERS LIST =============

@router.get("/users")
async def get_collaboration_users(current_user: User = Depends(get_current_user)):
    """Get list of users for mentions and DMs"""
    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0}
    ).to_list(500)
    
    return [{"id": u["id"], "name": u.get("full_name", ""), "email": u.get("email", "")} for u in users]
