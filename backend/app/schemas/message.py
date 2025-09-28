"""
Pydantic schemas for messaging system
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class MessageStatus(str, Enum):
    """Message status enumeration"""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"


class MessageType(str, Enum):
    """Message type enumeration"""
    GENERAL = "general"
    BOOKING_REQUEST = "booking_request"
    PROGRAM_UPDATE = "program_update"
    SESSION_REMINDER = "session_reminder"
    PROGRESS_UPDATE = "progress_update"
    URGENT = "urgent"


class ConversationStatus(str, Enum):
    """Conversation status enumeration"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


# Message Schemas
class MessageBase(BaseModel):
    """Base message schema"""
    receiver_id: int
    subject: Optional[str] = Field(None, max_length=255)
    content: str = Field(..., min_length=1)
    message_type: MessageType = MessageType.GENERAL
    is_important: bool = False
    attachments: Optional[List[str]] = Field(default_factory=list)
    parent_message_id: Optional[int] = None
    
    # Related entities
    related_booking_id: Optional[int] = None
    related_session_id: Optional[int] = None
    related_program_id: Optional[int] = None


class MessageCreate(MessageBase):
    """Schema for creating a message"""
    pass


class MessageUpdate(BaseModel):
    """Schema for updating a message"""
    content: Optional[str] = Field(None, min_length=1)
    is_important: Optional[bool] = None


class MessageResponse(MessageBase):
    """Schema for message response"""
    id: int
    conversation_id: Optional[int]
    sender_id: int
    status: MessageStatus
    is_read: bool
    read_at: Optional[datetime]
    is_edited: bool
    edited_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related data
    sender_name: Optional[str] = None
    sender_avatar: Optional[str] = None
    receiver_name: Optional[str] = None
    receiver_avatar: Optional[str] = None
    
    # Related entities
    related_booking: Optional[Dict[str, Any]] = None
    related_session: Optional[Dict[str, Any]] = None
    related_program: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


# Conversation Schemas
class ConversationBase(BaseModel):
    """Base conversation schema"""
    participant2_id: int
    subject: Optional[str] = Field(None, max_length=255)
    is_pinned: bool = False


class ConversationCreate(ConversationBase):
    """Schema for creating a conversation"""
    pass


class ConversationUpdate(BaseModel):
    """Schema for updating a conversation"""
    subject: Optional[str] = Field(None, max_length=255)
    is_pinned: Optional[bool] = None
    status: Optional[ConversationStatus] = None


class ConversationResponse(ConversationBase):
    """Schema for conversation response"""
    id: int
    participant1_id: int
    last_message_id: Optional[int]
    last_message_at: Optional[datetime]
    status: ConversationStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related data
    participant1_name: Optional[str] = None
    participant1_avatar: Optional[str] = None
    participant2_name: Optional[str] = None
    participant2_avatar: Optional[str] = None
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    
    class Config:
        from_attributes = True


# Message Template Schemas
class MessageTemplateBase(BaseModel):
    """Base message template schema"""
    name: str = Field(..., min_length=1, max_length=255)
    subject: Optional[str] = Field(None, max_length=255)
    content: str = Field(..., min_length=1)
    message_type: MessageType = MessageType.GENERAL
    variables: Optional[List[str]] = Field(default_factory=list)


class MessageTemplateCreate(MessageTemplateBase):
    """Schema for creating a message template"""
    pass


class MessageTemplateUpdate(BaseModel):
    """Schema for updating a message template"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    subject: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    message_type: Optional[MessageType] = None
    variables: Optional[List[str]] = None


class MessageTemplateResponse(MessageTemplateBase):
    """Schema for message template response"""
    id: int
    trainer_id: int
    usage_count: int
    last_used_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Notification Schemas
class NotificationBase(BaseModel):
    """Base notification schema"""
    user_id: int
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    notification_type: MessageType = MessageType.GENERAL
    priority: str = Field(default="normal", regex="^(low|normal|high|urgent)$")
    scheduled_for: Optional[datetime] = None
    
    # Related entities
    related_booking_id: Optional[int] = None
    related_session_id: Optional[int] = None
    related_program_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    """Schema for creating a notification"""
    pass


class NotificationUpdate(BaseModel):
    """Schema for updating a notification"""
    is_read: Optional[bool] = None


class NotificationResponse(NotificationBase):
    """Schema for notification response"""
    id: int
    message_id: Optional[int]
    is_read: bool
    read_at: Optional[datetime]
    is_sent: bool
    sent_at: Optional[datetime]
    email_sent: bool
    push_sent: bool
    sms_sent: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Related data
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None

    class Config:
        from_attributes = True


# Bulk Message Schemas
class BulkMessageCreate(BaseModel):
    """Schema for sending bulk messages"""
    receiver_ids: List[int] = Field(..., min_items=1)
    subject: Optional[str] = Field(None, max_length=255)
    content: str = Field(..., min_length=1)
    message_type: MessageType = MessageType.GENERAL
    is_important: bool = False
    attachments: Optional[List[str]] = Field(default_factory=list)
    
    # Related entities
    related_booking_id: Optional[int] = None
    related_session_id: Optional[int] = None
    related_program_id: Optional[int] = None


class BulkMessageResponse(BaseModel):
    """Schema for bulk message response"""
    total_sent: int
    successful_sends: int
    failed_sends: int
    message_ids: List[int]
    errors: List[str] = Field(default_factory=list)


# Search and Filter Schemas
class MessageSearchParams(BaseModel):
    """Schema for message search parameters"""
    query: Optional[str] = None
    message_type: Optional[MessageType] = None
    is_important: Optional[bool] = None
    is_read: Optional[bool] = None
    sender_id: Optional[int] = None
    receiver_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    related_booking_id: Optional[int] = None
    related_session_id: Optional[int] = None
    related_program_id: Optional[int] = None


class ConversationSearchParams(BaseModel):
    """Schema for conversation search parameters"""
    query: Optional[str] = None
    status: Optional[ConversationStatus] = None
    is_pinned: Optional[bool] = None
    participant_id: Optional[int] = None
    has_unread: Optional[bool] = None


# Statistics and Analytics Schemas
class MessageStats(BaseModel):
    """Schema for message statistics"""
    total_messages: int
    unread_messages: int
    important_messages: int
    messages_by_type: Dict[str, int]
    messages_this_week: int
    messages_this_month: int
    average_response_time_hours: Optional[float] = None


class ConversationStats(BaseModel):
    """Schema for conversation statistics"""
    total_conversations: int
    active_conversations: int
    archived_conversations: int
    pinned_conversations: int
    conversations_with_unread: int


# Quick Message Schemas (for common actions)
class QuickMessageCreate(BaseModel):
    """Schema for quick message creation"""
    receiver_id: int
    content: str = Field(..., min_length=1, max_length=1000)
    message_type: MessageType = MessageType.GENERAL


class ReplyMessageCreate(BaseModel):
    """Schema for replying to a message"""
    content: str = Field(..., min_length=1)
    is_important: bool = False


# Typing Indicator Schema
class TypingIndicator(BaseModel):
    """Schema for typing indicator"""
    conversation_id: int
    user_id: int
    is_typing: bool
    timestamp: datetime


# Message Read Receipt Schema
class ReadReceipt(BaseModel):
    """Schema for message read receipt"""
    message_id: int
    user_id: int
    read_at: datetime
