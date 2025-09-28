"""
API routes for messaging system
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional
from datetime import datetime, timedelta
import json

from app.database import get_db
from app.models import (
    Message, Conversation, MessageTemplate, Notification,
    User, Trainer, Booking, Session, Program
)
from app.schemas.message import (
    MessageCreate, MessageUpdate, MessageResponse,
    ConversationCreate, ConversationUpdate, ConversationResponse,
    MessageTemplateCreate, MessageTemplateUpdate, MessageTemplateResponse,
    NotificationCreate, NotificationUpdate, NotificationResponse,
    BulkMessageCreate, BulkMessageResponse,
    MessageSearchParams, ConversationSearchParams,
    MessageStats, ConversationStats,
    QuickMessageCreate, ReplyMessageCreate
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])


# Helper Functions
def get_or_create_conversation(db: Session, user1_id: int, user2_id: int) -> Conversation:
    """Get existing conversation or create a new one between two users"""
    conversation = db.query(Conversation).filter(
        or_(
            and_(Conversation.participant1_id == user1_id, Conversation.participant2_id == user2_id),
            and_(Conversation.participant1_id == user2_id, Conversation.participant2_id == user1_id)
        ),
        Conversation.status == "active"
    ).first()
    
    if not conversation:
        conversation = Conversation(
            participant1_id=min(user1_id, user2_id),
            participant2_id=max(user1_id, user2_id)
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    return conversation


def create_notification(
    db: Session, 
    user_id: int, 
    title: str, 
    content: str, 
    notification_type: str = "general",
    priority: str = "normal",
    message_id: Optional[int] = None,
    related_booking_id: Optional[int] = None,
    related_session_id: Optional[int] = None,
    related_program_id: Optional[int] = None
):
    """Create a notification for a user"""
    notification = Notification(
        user_id=user_id,
        message_id=message_id,
        title=title,
        content=content,
        notification_type=notification_type,
        priority=priority,
        related_booking_id=related_booking_id,
        related_session_id=related_session_id,
        related_program_id=related_program_id
    )
    db.add(notification)
    db.commit()
    return notification


# Message Management
@router.post("/", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message to another user"""
    
    # Validate receiver exists
    receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found"
        )
    
    # Check if users can communicate (basic validation)
    if current_user.id == message_data.receiver_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send message to yourself"
        )
    
    # Get or create conversation
    conversation = get_or_create_conversation(db, current_user.id, message_data.receiver_id)
    
    # Create message
    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        subject=message_data.subject,
        content=message_data.content,
        message_type=message_data.message_type.value,
        is_important=message_data.is_important,
        attachments=json.dumps(message_data.attachments) if message_data.attachments else None,
        parent_message_id=message_data.parent_message_id,
        related_booking_id=message_data.related_booking_id,
        related_session_id=message_data.related_session_id,
        related_program_id=message_data.related_program_id
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    # Update conversation last message
    conversation.last_message_id = message.id
    conversation.last_message_at = message.created_at
    db.commit()
    
    # Create notification for receiver
    background_tasks.add_task(
        create_notification,
        db,
        message_data.receiver_id,
        f"New message from {current_user.full_name}",
        message_data.content[:100] + "..." if len(message_data.content) > 100 else message_data.content,
        message_data.message_type.value,
        "normal",
        message.id
    )
    
    # Add related data for response
    message.sender_name = current_user.full_name
    message.sender_avatar = current_user.avatar
    message.receiver_name = receiver.full_name
    message.receiver_avatar = receiver.avatar
    
    # Convert attachments back to list
    message.attachments = json.loads(message.attachments) if message.attachments else []
    
    return message


@router.get("/", response_model=List[MessageResponse])
async def get_messages(
    skip: int = 0,
    limit: int = 100,
    conversation_id: Optional[int] = Query(None),
    message_type: Optional[str] = Query(None),
    is_important: Optional[bool] = Query(None),
    is_read: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages for the current user"""
    
    query = db.query(Message).filter(
        or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id)
    )
    
    # Apply filters
    if conversation_id:
        query = query.filter(Message.conversation_id == conversation_id)
    if message_type:
        query = query.filter(Message.message_type == message_type)
    if is_important is not None:
        query = query.filter(Message.is_important == is_important)
    if is_read is not None:
        query = query.filter(Message.is_read == is_read)
    
    messages = query.order_by(desc(Message.created_at)).offset(skip).limit(limit).all()
    
    # Add related data and convert JSON fields
    for message in messages:
        message.sender_name = message.sender.full_name
        message.sender_avatar = message.sender.avatar
        message.receiver_name = message.receiver.full_name
        message.receiver_avatar = message.receiver.avatar
        message.attachments = json.loads(message.attachments) if message.attachments else []
    
    return messages


@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific message"""
    
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check permissions
    if current_user.id not in [message.sender_id, message.receiver_id]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this message"
        )
    
    # Mark as read if current user is the receiver
    if current_user.id == message.receiver_id and not message.is_read:
        message.is_read = True
        message.read_at = datetime.utcnow()
        message.status = "read"
        db.commit()
    
    # Add related data
    message.sender_name = message.sender.full_name
    message.sender_avatar = message.sender.avatar
    message.receiver_name = message.receiver.full_name
    message.receiver_avatar = message.receiver.avatar
    message.attachments = json.loads(message.attachments) if message.attachments else []
    
    return message


@router.put("/{message_id}/read")
async def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a message as read"""
    
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check permissions
    if current_user.id != message.receiver_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the receiver can mark a message as read"
        )
    
    if not message.is_read:
        message.is_read = True
        message.read_at = datetime.utcnow()
        message.status = "read"
        db.commit()
    
    return {"message": "Message marked as read"}


# Conversation Management
@router.get("/conversations/", response_model=List[ConversationResponse])
async def get_conversations(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    is_pinned: Optional[bool] = Query(None),
    has_unread: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get conversations for the current user"""
    
    query = db.query(Conversation).filter(
        or_(Conversation.participant1_id == current_user.id, Conversation.participant2_id == current_user.id)
    )
    
    # Apply filters
    if status:
        query = query.filter(Conversation.status == status)
    if is_pinned is not None:
        query = query.filter(Conversation.is_pinned == is_pinned)
    
    conversations = query.order_by(desc(Conversation.last_message_at)).offset(skip).limit(limit).all()
    
    # Add related data and calculate unread count
    for conversation in conversations:
        # Determine the other participant
        if conversation.participant1_id == current_user.id:
            other_participant = conversation.participant2
        else:
            other_participant = conversation.participant1
        
        conversation.participant1_name = conversation.participant1.full_name
        conversation.participant1_avatar = conversation.participant1.avatar
        conversation.participant2_name = conversation.participant2.full_name
        conversation.participant2_avatar = conversation.participant2.avatar
        
        # Calculate unread messages count
        unread_count = db.query(Message).filter(
            Message.conversation_id == conversation.id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).count()
        conversation.unread_count = unread_count
    
    # Filter by has_unread after calculating unread counts
    if has_unread is not None:
        conversations = [c for c in conversations if (c.unread_count > 0) == has_unread]
    
    return conversations


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(
    conversation_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages in a specific conversation"""
    
    # Check if user is participant in this conversation
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    if current_user.id not in [conversation.participant1_id, conversation.participant2_id]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this conversation"
        )
    
    # Get messages
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(desc(Message.created_at)).offset(skip).limit(limit).all()
    
    # Add related data
    for message in messages:
        message.sender_name = message.sender.full_name
        message.sender_avatar = message.sender.avatar
        message.receiver_name = message.receiver.full_name
        message.receiver_avatar = message.receiver.avatar
        message.attachments = json.loads(message.attachments) if message.attachments else []
        
        # Mark as read if current user is the receiver
        if current_user.id == message.receiver_id and not message.is_read:
            message.is_read = True
            message.read_at = datetime.utcnow()
            message.status = "read"
    
    db.commit()
    return messages


# Message Templates
@router.post("/templates", response_model=MessageTemplateResponse)
async def create_message_template(
    template_data: MessageTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a message template"""
    
    # Only trainers and admins can create templates
    if current_user.role not in ["trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers and admins can create message templates"
        )
    
    # Get trainer ID
    trainer_id = current_user.trainer_profile.id if current_user.trainer_profile else 1
    
    template = MessageTemplate(
        trainer_id=trainer_id,
        name=template_data.name,
        subject=template_data.subject,
        content=template_data.content,
        message_type=template_data.message_type.value,
        variables=json.dumps(template_data.variables) if template_data.variables else None
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    # Convert variables back to list
    template.variables = json.loads(template.variables) if template.variables else []
    
    return template


@router.get("/templates", response_model=List[MessageTemplateResponse])
async def get_message_templates(
    skip: int = 0,
    limit: int = 100,
    message_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get message templates"""
    
    # Only trainers and admins can view templates
    if current_user.role not in ["trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers and admins can view message templates"
        )
    
    query = db.query(MessageTemplate).filter(MessageTemplate.is_active == True)
    
    # Filter by trainer (trainers can only see their own templates)
    if current_user.role == "trainer":
        trainer_id = current_user.trainer_profile.id
        query = query.filter(MessageTemplate.trainer_id == trainer_id)
    
    # Apply filters
    if message_type:
        query = query.filter(MessageTemplate.message_type == message_type)
    
    templates = query.order_by(desc(MessageTemplate.usage_count)).offset(skip).limit(limit).all()
    
    # Convert variables back to lists
    for template in templates:
        template.variables = json.loads(template.variables) if template.variables else []
    
    return templates


# Bulk Messaging
@router.post("/bulk", response_model=BulkMessageResponse)
async def send_bulk_messages(
    bulk_data: BulkMessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send messages to multiple users"""
    
    # Only trainers and admins can send bulk messages
    if current_user.role not in ["trainer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainers and admins can send bulk messages"
        )
    
    successful_sends = 0
    failed_sends = 0
    message_ids = []
    errors = []
    
    for receiver_id in bulk_data.receiver_ids:
        try:
            # Validate receiver exists
            receiver = db.query(User).filter(User.id == receiver_id).first()
            if not receiver:
                errors.append(f"User {receiver_id} not found")
                failed_sends += 1
                continue
            
            # Get or create conversation
            conversation = get_or_create_conversation(db, current_user.id, receiver_id)
            
            # Create message
            message = Message(
                conversation_id=conversation.id,
                sender_id=current_user.id,
                receiver_id=receiver_id,
                subject=bulk_data.subject,
                content=bulk_data.content,
                message_type=bulk_data.message_type.value,
                is_important=bulk_data.is_important,
                attachments=json.dumps(bulk_data.attachments) if bulk_data.attachments else None,
                related_booking_id=bulk_data.related_booking_id,
                related_session_id=bulk_data.related_session_id,
                related_program_id=bulk_data.related_program_id
            )
            
            db.add(message)
            db.commit()
            db.refresh(message)
            
            message_ids.append(message.id)
            successful_sends += 1
            
            # Create notification
            background_tasks.add_task(
                create_notification,
                db,
                receiver_id,
                f"New message from {current_user.full_name}",
                bulk_data.content[:100] + "..." if len(bulk_data.content) > 100 else bulk_data.content,
                bulk_data.message_type.value,
                "normal",
                message.id
            )
            
        except Exception as e:
            errors.append(f"Failed to send to user {receiver_id}: {str(e)}")
            failed_sends += 1
    
    return BulkMessageResponse(
        total_sent=len(bulk_data.receiver_ids),
        successful_sends=successful_sends,
        failed_sends=failed_sends,
        message_ids=message_ids,
        errors=errors
    )


# Notifications
@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = 0,
    limit: int = 100,
    is_read: Optional[bool] = Query(None),
    notification_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notifications for the current user"""
    
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    # Apply filters
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    
    notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
    
    # Add related data
    for notification in notifications:
        notification.user_name = notification.user.full_name
        notification.user_avatar = notification.user.avatar
    
    return notifications


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read"""
    
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.commit()
    
    return {"message": "Notification marked as read"}


# Statistics
@router.get("/stats/messages", response_model=MessageStats)
async def get_message_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get message statistics for the current user"""
    
    # Total messages
    total_messages = db.query(Message).filter(
        or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id)
    ).count()
    
    # Unread messages
    unread_messages = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()
    
    # Important messages
    important_messages = db.query(Message).filter(
        or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id),
        Message.is_important == True
    ).count()
    
    # Messages by type
    messages_by_type = {}
    for message_type in ["general", "booking_request", "program_update", "session_reminder", "progress_update", "urgent"]:
        count = db.query(Message).filter(
            or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id),
            Message.message_type == message_type
        ).count()
        messages_by_type[message_type] = count
    
    # Messages this week/month
    week_ago = datetime.utcnow() - timedelta(days=7)
    month_ago = datetime.utcnow() - timedelta(days=30)
    
    messages_this_week = db.query(Message).filter(
        or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id),
        Message.created_at >= week_ago
    ).count()
    
    messages_this_month = db.query(Message).filter(
        or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id),
        Message.created_at >= month_ago
    ).count()
    
    return MessageStats(
        total_messages=total_messages,
        unread_messages=unread_messages,
        important_messages=important_messages,
        messages_by_type=messages_by_type,
        messages_this_week=messages_this_week,
        messages_this_month=messages_this_month
    )
