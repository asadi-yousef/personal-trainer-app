"""
Chatbot router providing a minimal AI-assisted endpoint.
Falls back to simple rule-based responses if no OpenAI key is configured.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List

from app.config import settings


router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None
    context: Optional[str] = None
    user_role: Optional[str] = None  # 'client' | 'trainer' | 'admin'


class ChatResponse(BaseModel):
    reply: str
    source: str
    suggestions: List[dict] = []  # [{label, href}]


def _suggestions_for(message: str, context: Optional[str], user_role: Optional[str]) -> List[dict]:
    text = (message or "").lower()
    suggestions: List[dict] = []

    # Role-specific primary paths
    role = (user_role or "").lower()
    if role == "trainer":
        # Trainer-centric routes with specific project knowledge
        if any(k in text for k in ["availability", "slots", "schedule", "time"]):
            suggestions.extend([
                {"label": "📅 Manage Availability", "href": "/trainer/availability"},
                {"label": "⚙️ Scheduling Preferences", "href": "/trainer/scheduling-preferences"},
            ])
        if any(k in text for k in ["booking", "request", "approve", "reject", "session"]):
            suggestions.extend([
                {"label": "📋 Booking Requests", "href": "/trainer/bookings"},
                {"label": "📊 My Schedule", "href": "/trainer/schedule"},
            ])
        if any(k in text for k in ["client", "messages", "chat", "communicate"]):
            suggestions.extend([
                {"label": "💬 Trainer Messages", "href": "/trainer/messages"},
                {"label": "👥 My Clients", "href": "/trainer/clients"},
            ])
        if any(k in text for k in ["profile", "setup", "complete", "registration"]):
            suggestions.extend([
                {"label": "✅ Complete Registration", "href": "/trainer/complete-registration"},
                {"label": "👤 My Profile", "href": "/trainer/profile"},
            ])
        # Always show trainer dashboard
        suggestions.append({"label": "🏠 Trainer Dashboard", "href": "/trainer"})
    else:
        # Client flows with specific project knowledge
        if any(k in text for k in ["book", "schedule", "session", "reschedule", "appointment"]):
            suggestions.extend([
                {"label": "🤖 Optimal Scheduling", "href": "/optimal-scheduling"},
                {"label": "📅 Direct Booking", "href": "/direct-booking"},
                {"label": "👨‍💼 Browse Trainers", "href": "/trainers"},
                {"label": "📋 My Schedule", "href": "/client/schedule"},
            ])
        if any(k in text for k in ["trainer", "find", "recommend", "browse", "search"]):
            suggestions.extend([
                {"label": "👨‍💼 Browse Trainers", "href": "/trainers"},
                {"label": "🤖 Optimal Scheduling", "href": "/optimal-scheduling"},
                {"label": "🏠 Client Dashboard", "href": "/client"},
            ])
        if any(k in text for k in ["pay", "payment", "refund", "card", "billing"]):
            suggestions.extend([
                {"label": "💳 My Bookings", "href": "/client"},
                {"label": "📋 Payment History", "href": "/client"},
            ])
        if any(k in text for k in ["message", "chat", "contact", "communicate"]):
            suggestions.append({"label": "💬 Client Messages", "href": "/client/messages"})
        if any(k in text for k in ["optimal", "ai", "algorithm", "smart"]):
            suggestions.extend([
                {"label": "🤖 Optimal Scheduling", "href": "/optimal-scheduling"},
                {"label": "👨‍💼 Browse Trainers", "href": "/trainers"},
            ])
        if any(k in text for k in ["help", "guide", "how", "where", "what"]):
            suggestions.extend([
                {"label": "🏠 Client Dashboard", "href": "/client"},
                {"label": "👨‍💼 Browse Trainers", "href": "/trainers"},
                {"label": "🤖 Optimal Scheduling", "href": "/optimal-scheduling"},
            ])
        if any(k in text for k in ["login", "signin", "sign in"]):
            suggestions.append({"label": "🔐 Sign In", "href": "/auth/signin"})
        if any(k in text for k in ["signup", "register", "sign up"]):
            suggestions.append({"label": "📝 Sign Up", "href": "/auth/signup"})

    # Context-aware nudges
    if context:
        if "/trainers" in context and not any(s["href"] == "/trainers" for s in suggestions):
            suggestions.insert(0, {"label": "Browse Trainers", "href": "/trainers"})
        if "/client" in context and not any(s["href"].startswith("/client") for s in suggestions):
            suggestions.append({"label": "Client Dashboard", "href": "/client"})

    # Deduplicate while preserving order
    seen = set()
    unique: List[dict] = []
    for s in suggestions:
        key = (s.get("label"), s.get("href"))
        if key in seen:
            continue
        seen.add(key)
        unique.append(s)
    return unique[:5]


def _fallback_reply(message: str, context: Optional[str], user_role: Optional[str] = None) -> ChatResponse:
    text = (message or "").lower().strip()
    role = (user_role or "").lower()
    
    # Role-specific responses
    if role == "trainer":
        if any(k in text for k in ["book", "session", "schedule", "reschedule", "appointment"]):
            reply = (
                "📋 **Managing Bookings as a Trainer:**\n"
                "• **Booking Requests** - Review and approve/reject client requests\n"
                "• **My Schedule** - View your upcoming sessions\n"
                "• **Availability** - Set your available time slots\n"
                "• **Scheduling Preferences** - Configure your work hours and breaks\n\n"
                "💡 **Pro Tip:** Use Optimal Schedule to see AI-generated recommendations!"
            )
        elif any(k in text for k in ["client", "clients", "customer"]):
            reply = (
                "👥 **Client Management:**\n"
                "• **My Clients** - View all your clients and their progress\n"
                "• **Messages** - Chat with clients about sessions and goals\n"
                "• **Client Profiles** - Track fitness goals and preferences\n"
                "• **Session History** - Review past training sessions\n\n"
                "Build strong relationships with your clients!"
            )
        elif any(k in text for k in ["availability", "time", "schedule", "slots"]):
            reply = (
                "📅 **Managing Your Availability:**\n"
                "• **Set Time Slots** - Define when you're available\n"
                "• **Work Hours** - Configure your daily schedule\n"
                "• **Days Off** - Block unavailable days\n"
                "• **Break Times** - Set minimum breaks between sessions\n"
                "• **Max Sessions** - Limit daily session count\n\n"
                "Go to Availability to manage your schedule!"
            )
        elif any(k in text for k in ["profile", "setup", "complete", "registration"]):
            reply = (
                "👤 **Trainer Profile Setup:**\n"
                "• **Complete Registration** - Finish your trainer profile\n"
                "• **Specialties** - Add your training specialties\n"
                "• **Pricing** - Set your hourly rates\n"
                "• **Bio & Experience** - Tell clients about yourself\n"
                "• **Certifications** - Add your qualifications\n\n"
                "A complete profile attracts more clients!"
            )
        elif any(k in text for k in ["earnings", "money", "pay", "payment", "income"]):
            reply = (
                "💰 **Trainer Earnings:**\n"
                "• **Session Payments** - Track payments from clients\n"
                "• **Pricing Strategy** - Set competitive rates\n"
                "• **Payment History** - View all transactions\n"
                "• **Earnings Analytics** - Track your income trends\n\n"
                "Manage your pricing in your profile settings!"
            )
        else:
            reply = (
                "🏋️‍♂️ **Trainer Dashboard Features:**\n"
                "• **Booking Requests** - Approve/reject client requests\n"
                "• **My Schedule** - Manage your training sessions\n"
                "• **Client Management** - Track your clients\n"
                "• **Availability** - Set your available times\n"
                "• **Messages** - Communicate with clients\n"
                "• **Analytics** - Track your performance\n\n"
                "What specific area would you like help with?"
            )
    else:  # Client role or no role specified
        if any(k in text for k in ["book", "session", "schedule", "reschedule", "appointment"]):
            reply = (
                "🎯 **Booking Options for Clients:**\n"
                "• **Optimal Scheduling** - AI finds best times across all trainers\n"
                "• **Direct Booking** - Book specific trainer directly\n"
                "• **Browse Trainers** - See all available trainers first\n\n"
                "💡 **Pro Tip:** Use Optimal Scheduling for the best matches!"
            )
        elif any(k in text for k in ["optimal", "scheduling", "ai", "algorithm"]):
            reply = (
                "🤖 **Optimal Scheduling for Clients:**\n"
                "• AI-powered time slot matching\n"
                "• 60-minute or 120-minute sessions\n"
                "• Smart trainer recommendations\n"
                "• Budget and preference matching\n"
                "• Real-time availability checking\n\n"
                "Go to Optimal Scheduling to try it!"
            )
        elif any(k in text for k in ["trainer", "find", "browse", "search"]):
            reply = (
                "👨‍💼 **Finding Trainers as a Client:**\n"
                "• **Browse Trainers** - See all available trainers\n"
                "• **Filter by specialty** - Strength, Yoga, Cardio, etc.\n"
                "• **Check ratings and reviews**\n"
                "• **View trainer profiles** and pricing\n"
                "• **Book directly** or use Optimal Scheduling\n\n"
                "Start at the Trainers page!"
            )
        elif any(k in text for k in ["pay", "payment", "refund", "billing", "cost"]):
            reply = (
                "💳 **Payment System for Clients:**\n"
                "• **Simulated payments** for demo purposes\n"
                "• **Pay per session** or package deals\n"
                "• **Secure payment processing**\n"
                "• **Payment history** in your dashboard\n"
                "• **Refund requests** handled by trainers\n\n"
                "Go to your Client dashboard → My Bookings to pay!"
            )
        elif any(k in text for k in ["message", "chat", "contact", "communicate"]):
            reply = (
                "💬 **Messaging Your Trainer:**\n"
                "• **Direct messaging** with your trainer\n"
                "• **Real-time chat** interface\n"
                "• **Message history** preserved\n"
                "• **File sharing** for workout plans\n"
                "• **Notification system**\n\n"
                "Access via Client → Messages!"
            )
        elif any(k in text for k in ["schedule", "calendar", "availability", "time"]):
            reply = (
                "📅 **Managing Your Schedule:**\n"
                "• **My Schedule** - View your upcoming sessions\n"
                "• **Reschedule sessions** - Change appointment times\n"
                "• **Cancel sessions** - With proper notice\n"
                "• **Session history** - Track your progress\n"
                "• **Calendar integration** - Sync with your calendar\n\n"
                "Use Optimal Scheduling for best results!"
            )
        elif any(k in text for k in ["profile", "account", "settings", "preferences"]):
            reply = (
                "⚙️ **Client Account Management:**\n"
                "• **Complete your profile** for better trainer matches\n"
                "• **Set fitness goals** and preferences\n"
                "• **Update contact information**\n"
                "• **Manage notifications**\n"
                "• **View booking history**\n\n"
                "Go to your Client dashboard to manage settings!"
            )
        elif any(k in text for k in ["help", "how", "where", "what", "guide"]):
            reply = (
                "🚀 **Client Guide to FitConnect:**\n\n"
                "**Main Features:**\n"
                "• Browse Trainers → Find your perfect match\n"
                "• Optimal Scheduling → AI-powered booking\n"
                "• Direct Booking → Book specific trainer\n"
                "• My Schedule → Manage your sessions\n"
                "• Messages → Chat with trainers\n\n"
                "**Getting Started:**\n"
                "1. Browse trainers to see who's available\n"
                "2. Use Optimal Scheduling for best matches\n"
                "3. Book your first session\n"
                "4. Message your trainer to coordinate\n\n"
                "What specific feature would you like help with?"
            )
        else:
            reply = (
                "🤖 **I can help you as a Client with:**\n"
                "• **Booking sessions** (Optimal Scheduling or Direct Booking)\n"
                "• **Finding trainers** (Browse and filter options)\n"
                "• **Managing your schedule** (View and reschedule sessions)\n"
                "• **Messaging trainers** (Real-time chat)\n"
                "• **Payment and billing** (Secure payment system)\n"
                "• **Platform navigation** (How to use features)\n\n"
                "What would you like to know about?"
            )

    return ChatResponse(
        reply=reply,
        source="fallback",
        suggestions=_suggestions_for(message, context, user_role),
    )


@router.post("/message", response_model=ChatResponse)
async def chat_message(payload: ChatRequest) -> ChatResponse:
    # If no OpenAI key configured, return a simple helpful fallback
    if not settings.openai_api_key:
        return _fallback_reply(payload.message, payload.context, payload.user_role)

    # Attempt OpenAI response; fail gracefully to fallback on any error
    try:
        # Lazy import to avoid hard dependency when no key is set
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        messages = [{"role": "system", "content": (
            "You are FitConnect's AI assistant for a personal trainer booking platform. "
            "You have deep knowledge of this specific platform and its features:\n\n"
            "**CORE FEATURES:**\n"
            "• Optimal Scheduling - AI-powered booking that finds best times across all trainers\n"
            "• Direct Booking - Book specific trainers directly\n"
            "• Browse Trainers - Filter and search trainer profiles\n"
            "• Real-time messaging between clients and trainers\n"
            "• Payment system with simulated transactions\n"
            "• 60-minute and 120-minute session options\n"
            "• Smart scheduling algorithm with conflict detection\n\n"
            "**USER ROLES:**\n"
            "• Clients: Browse trainers, book sessions, manage schedule, message trainers\n"
            "• Trainers: Set availability, manage bookings, communicate with clients\n"
            "• Admins: Platform management and analytics\n\n"
            "**KEY NAVIGATION:**\n"
            "• /trainers - Browse all trainers\n"
            "• /optimal-scheduling - AI-powered booking\n"
            "• /direct-booking - Book specific trainer\n"
            "• /client - Client dashboard\n"
            "• /trainer - Trainer dashboard\n\n"
            "Be helpful, specific, and always provide actionable suggestions. "
            "Reference specific features and pages when relevant."
        )}]

        if payload.context:
            messages.append({"role": "system", "content": f"User is currently on: {payload.context}"})

        if payload.user_role:
            messages.append({"role": "system", "content": f"User role: {payload.user_role}"})

        if payload.history:
            for m in payload.history[-10:]:
                messages.append({"role": m.role, "content": m.content})

        messages.append({"role": "user", "content": payload.message})

        completion = client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            temperature=0.4,
            max_tokens=300,
        )

        reply = (completion.choices[0].message.content or "").strip()
        if not reply:
            return _fallback_reply(payload.message, payload.context, payload.user_role)
        return ChatResponse(
            reply=reply,
            source="openai",
            suggestions=_suggestions_for(payload.message, payload.context, payload.user_role),
        )

    except Exception as e:
        # Log the error for debugging
        print(f"OpenAI API error: {e}")
        return _fallback_reply(payload.message, payload.context, payload.user_role)



