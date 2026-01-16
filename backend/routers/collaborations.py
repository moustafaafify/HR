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
    
    # Get user statuses
    statuses = {}
    status_docs = await db.collab_user_status.find({}, {"_id": 0}).to_list(500)
    for s in status_docs:
        statuses[s["user_id"]] = s
    
    result = []
    for u in users:
        user_status = statuses.get(u["id"], {})
        result.append({
            "id": u["id"], 
            "name": u.get("full_name", ""), 
            "email": u.get("email", ""),
            "status": user_status.get("status", "offline"),
            "status_text": user_status.get("status_text"),
            "status_emoji": user_status.get("status_emoji")
        })
    
    return result


# ============= POLLS =============

@router.post("/channels/{channel_id}/polls")
async def create_poll(
    channel_id: str,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Create a poll in a channel"""
    options = [
        {"id": str(uuid.uuid4())[:8], "text": opt, "votes": []}
        for opt in data.get("options", [])
    ]
    
    poll = Poll(
        channel_id=channel_id,
        question=data.get("question"),
        options=options,
        allow_multiple=data.get("allow_multiple", False),
        is_anonymous=data.get("is_anonymous", False),
        ends_at=data.get("ends_at"),
        created_by=current_user.id,
        created_by_name=current_user.full_name
    )
    
    await db.collab_polls.insert_one(poll.model_dump())
    
    # Create message for poll
    message = Message(
        channel_id=channel_id,
        content=f"📊 Poll: {poll.question}",
        content_type="poll",
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        attachments=[{"type": "poll", "poll_id": poll.id}]
    )
    await db.collab_messages.insert_one(message.model_dump())
    
    # Update poll with message_id
    await db.collab_polls.update_one({"id": poll.id}, {"$set": {"message_id": message.id}})
    
    return {**poll.model_dump(), "message_id": message.id}


@router.get("/channels/{channel_id}/polls")
async def get_polls(channel_id: str, current_user: User = Depends(get_current_user)):
    """Get polls in a channel"""
    polls = await db.collab_polls.find(
        {"channel_id": channel_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return polls


@router.get("/polls/{poll_id}")
async def get_poll(poll_id: str, current_user: User = Depends(get_current_user)):
    """Get a single poll"""
    poll = await db.collab_polls.find_one({"id": poll_id}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    return poll


@router.post("/polls/{poll_id}/vote")
async def vote_poll(
    poll_id: str,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Vote on a poll"""
    poll = await db.collab_polls.find_one({"id": poll_id}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    if poll.get("is_closed"):
        raise HTTPException(status_code=400, detail="Poll is closed")
    
    option_ids = data.get("option_ids", [])
    if not poll.get("allow_multiple") and len(option_ids) > 1:
        raise HTTPException(status_code=400, detail="Multiple votes not allowed")
    
    # Remove existing votes
    for opt in poll["options"]:
        if current_user.id in opt.get("votes", []):
            opt["votes"].remove(current_user.id)
    
    # Add new votes
    for opt in poll["options"]:
        if opt["id"] in option_ids:
            if current_user.id not in opt.get("votes", []):
                opt["votes"].append(current_user.id)
    
    await db.collab_polls.update_one({"id": poll_id}, {"$set": {"options": poll["options"]}})
    
    return await db.collab_polls.find_one({"id": poll_id}, {"_id": 0})


@router.post("/polls/{poll_id}/close")
async def close_poll(poll_id: str, current_user: User = Depends(get_current_user)):
    """Close a poll"""
    poll = await db.collab_polls.find_one({"id": poll_id}, {"_id": 0})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    if poll["created_by"] != current_user.id and current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Only poll creator can close")
    
    await db.collab_polls.update_one({"id": poll_id}, {"$set": {"is_closed": True}})
    return {"message": "Poll closed"}


# ============= USER STATUS =============

@router.get("/status")
async def get_my_status(current_user: User = Depends(get_current_user)):
    """Get current user's status"""
    status = await db.collab_user_status.find_one({"user_id": current_user.id}, {"_id": 0})
    if not status:
        status = UserStatus(user_id=current_user.id).model_dump()
    return status


@router.put("/status")
async def update_my_status(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update current user's status"""
    status_data = {
        "user_id": current_user.id,
        "status": data.get("status", "online"),
        "status_text": data.get("status_text"),
        "status_emoji": data.get("status_emoji"),
        "clear_at": data.get("clear_at"),
        "last_active": datetime.now(timezone.utc).isoformat()
    }
    
    await db.collab_user_status.update_one(
        {"user_id": current_user.id},
        {"$set": status_data},
        upsert=True
    )
    
    return status_data


@router.get("/status/all")
async def get_all_statuses(current_user: User = Depends(get_current_user)):
    """Get all user statuses"""
    statuses = await db.collab_user_status.find({}, {"_id": 0}).to_list(500)
    return {s["user_id"]: s for s in statuses}


# ============= CHANNEL CATEGORIES =============

@router.get("/categories")
async def get_categories(current_user: User = Depends(get_current_user)):
    """Get channel categories"""
    categories = await db.collab_categories.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    return categories


@router.post("/categories")
async def create_category(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a channel category"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.CORP_ADMIN]:
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Get max order
    max_order = await db.collab_categories.find_one(sort=[("order", -1)])
    next_order = (max_order.get("order", 0) + 1) if max_order else 0
    
    category = ChannelCategory(
        name=data.get("name"),
        order=data.get("order", next_order),
        created_by=current_user.id
    )
    
    await db.collab_categories.insert_one(category.model_dump())
    return category.model_dump()


@router.put("/categories/{category_id}")
async def update_category(
    category_id: str,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update a category"""
    await db.collab_categories.update_one({"id": category_id}, {"$set": data})
    return await db.collab_categories.find_one({"id": category_id}, {"_id": 0})


@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: User = Depends(get_current_user)):
    """Delete a category"""
    await db.collab_categories.delete_one({"id": category_id})
    # Remove category from channels
    await db.collab_channels.update_many(
        {"category_id": category_id},
        {"$unset": {"category_id": ""}}
    )
    return {"message": "Category deleted"}


# ============= QUICK REPLIES =============

@router.get("/quick-replies")
async def get_quick_replies(current_user: User = Depends(get_current_user)):
    """Get user's quick replies"""
    replies = await db.collab_quick_replies.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(50)
    return replies


@router.post("/quick-replies")
async def create_quick_reply(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a quick reply template"""
    reply = QuickReply(
        user_id=current_user.id,
        title=data.get("title"),
        content=data.get("content"),
        shortcut=data.get("shortcut")
    )
    
    await db.collab_quick_replies.insert_one(reply.model_dump())
    return reply.model_dump()


@router.put("/quick-replies/{reply_id}")
async def update_quick_reply(
    reply_id: str,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update a quick reply"""
    await db.collab_quick_replies.update_one(
        {"id": reply_id, "user_id": current_user.id},
        {"$set": data}
    )
    return await db.collab_quick_replies.find_one({"id": reply_id}, {"_id": 0})


@router.delete("/quick-replies/{reply_id}")
async def delete_quick_reply(reply_id: str, current_user: User = Depends(get_current_user)):
    """Delete a quick reply"""
    await db.collab_quick_replies.delete_one({"id": reply_id, "user_id": current_user.id})
    return {"message": "Quick reply deleted"}


# ============= READ RECEIPTS =============

@router.post("/channels/{channel_id}/read")
async def mark_channel_read(channel_id: str, current_user: User = Depends(get_current_user)):
    """Mark a channel as read"""
    # Get last message
    last_message = await db.collab_messages.find_one(
        {"channel_id": channel_id, "is_deleted": False},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    receipt = {
        "user_id": current_user.id,
        "channel_id": channel_id,
        "last_read_at": datetime.now(timezone.utc).isoformat(),
        "last_read_message_id": last_message["id"] if last_message else None
    }
    
    await db.collab_read_receipts.update_one(
        {"user_id": current_user.id, "channel_id": channel_id},
        {"$set": receipt},
        upsert=True
    )
    
    return receipt


@router.get("/unread")
async def get_unread_counts(current_user: User = Depends(get_current_user)):
    """Get unread message counts per channel"""
    # Get user's read receipts
    receipts = await db.collab_read_receipts.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(100)
    
    receipt_map = {r["channel_id"]: r for r in receipts}
    
    # Get accessible channels
    channels = await db.collab_channels.find({
        "$or": [
            {"type": "public"},
            {"members": current_user.id},
            {"created_by": current_user.id}
        ],
        "is_archived": False
    }, {"_id": 0, "id": 1}).to_list(100)
    
    unread = {}
    for channel in channels:
        channel_id = channel["id"]
        receipt = receipt_map.get(channel_id)
        
        if receipt:
            # Count messages after last read
            count = await db.collab_messages.count_documents({
                "channel_id": channel_id,
                "created_at": {"$gt": receipt["last_read_at"]},
                "is_deleted": False,
                "sender_id": {"$ne": current_user.id}
            })
        else:
            # All messages are unread
            count = await db.collab_messages.count_documents({
                "channel_id": channel_id,
                "is_deleted": False,
                "sender_id": {"$ne": current_user.id}
            })
        
        if count > 0:
            unread[channel_id] = count
    
    return unread


# ============= NOTIFICATION PREFERENCES =============

@router.get("/notifications/preferences")
async def get_notification_preferences(current_user: User = Depends(get_current_user)):
    """Get user's notification preferences"""
    prefs = await db.collab_notification_prefs.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(100)
    return {p["channel_id"]: p for p in prefs}


@router.put("/channels/{channel_id}/notifications")
async def update_channel_notifications(
    channel_id: str,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update notification preferences for a channel"""
    pref = {
        "user_id": current_user.id,
        "channel_id": channel_id,
        "muted": data.get("muted", False),
        "mute_until": data.get("mute_until"),
        "notify_all": data.get("notify_all", True),
        "notify_mentions": data.get("notify_mentions", True),
        "notify_replies": data.get("notify_replies", True)
    }
    
    await db.collab_notification_prefs.update_one(
        {"user_id": current_user.id, "channel_id": channel_id},
        {"$set": pref},
        upsert=True
    )
    
    return pref


# ============= ENHANCED SEARCH =============

@router.get("/search/advanced")
async def advanced_search(
    q: str,
    type: Optional[str] = None,
    channel_id: Optional[str] = None,
    sender_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    has_attachments: Optional[bool] = None,
    is_pinned: Optional[bool] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Advanced search with filters"""
    results = {"messages": [], "files": [], "polls": []}
    
    # Build message query
    msg_query = {"content": {"$regex": q, "$options": "i"}, "is_deleted": False}
    
    if channel_id:
        msg_query["channel_id"] = channel_id
    if sender_id:
        msg_query["sender_id"] = sender_id
    if date_from:
        msg_query["created_at"] = {"$gte": date_from}
    if date_to:
        if "created_at" in msg_query:
            msg_query["created_at"]["$lte"] = date_to
        else:
            msg_query["created_at"] = {"$lte": date_to}
    if has_attachments:
        msg_query["attachments.0"] = {"$exists": True}
    if is_pinned is not None:
        msg_query["is_pinned"] = is_pinned
    
    if not type or type == "messages":
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
    
    if not type or type == "polls":
        poll_query = {"question": {"$regex": q, "$options": "i"}}
        if channel_id:
            poll_query["channel_id"] = channel_id
        
        results["polls"] = await db.collab_polls.find(
            poll_query, {"_id": 0}
        ).sort("created_at", -1).to_list(limit)
    
    return results


# ============= MENTIONS =============

@router.get("/mentions")
async def get_my_mentions(
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get messages where current user is mentioned"""
    messages = await db.collab_messages.find(
        {"mentions": current_user.id, "is_deleted": False},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return messages


# ============= CHANNEL MEMBERS =============

@router.get("/channels/{channel_id}/members")
async def get_channel_members(channel_id: str, current_user: User = Depends(get_current_user)):
    """Get members of a channel"""
    channel = await db.collab_channels.find_one({"id": channel_id}, {"_id": 0})
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    member_ids = channel.get("members", [])
    
    # Get user info for each member
    members = []
    for user_id in member_ids:
        user_info = await get_user_info(user_id)
        # Get status
        status = await db.collab_user_status.find_one({"user_id": user_id}, {"_id": 0})
        user_info["status"] = status.get("status", "offline") if status else "offline"
        user_info["status_text"] = status.get("status_text") if status else None
        members.append(user_info)
    
    return members


# ============= EXPORT CHAT =============

@router.get("/channels/{channel_id}/export")
async def export_channel_chat(
    channel_id: str,
    format: str = "json",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Export channel chat history"""
    query = {"channel_id": channel_id, "is_deleted": False}
    
    if date_from:
        query["created_at"] = {"$gte": date_from}
    if date_to:
        if "created_at" in query:
            query["created_at"]["$lte"] = date_to
        else:
            query["created_at"] = {"$lte": date_to}
    
    messages = await db.collab_messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(10000)
    
    channel = await db.collab_channels.find_one({"id": channel_id}, {"_id": 0})
    
    export_data = {
        "channel": channel,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "exported_by": current_user.full_name,
        "message_count": len(messages),
        "messages": messages
    }
    
    return export_data

