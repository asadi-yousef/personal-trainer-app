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
        # Trainer-centric routes
        if any(k in text for k in ["availability", "slots", "schedule"]):
            suggestions.append({"label": "Manage Availability", "href": "/trainer/availability"})
        if any(k in text for k in ["booking", "request", "approve", "reject"]):
            suggestions.append({"label": "Booking Requests", "href": "/trainer/bookings"})
        if any(k in text for k in ["client", "messages", "chat"]):
            suggestions.append({"label": "Trainer Messages", "href": "/trainer/messages"})
        suggestions.extend([
            {"label": "Complete Registration", "href": "/trainer/complete-registration"},
            {"label": "Scheduling Preferences", "href": "/trainer/scheduling-preferences"},
            {"label": "Trainer Dashboard", "href": "/trainer"},
        ])
    else:
        # Default to client flows
        if any(k in text for k in ["book", "schedule", "session", "reschedule"]):
            suggestions.extend([
                {"label": "Find Trainers", "href": "/trainers"},
                {"label": "Direct Booking", "href": "/direct-booking"},
                {"label": "Optimal Scheduling", "href": "/optimal-scheduling"},
                {"label": "My Schedule", "href": "/client/schedule"},
            ])
        if any(k in text for k in ["trainer", "find", "recommend"]):
            suggestions.extend([
                {"label": "Browse Trainers", "href": "/trainers"},
                {"label": "Client Dashboard", "href": "/client"},
            ])
        if any(k in text for k in ["pay", "payment", "refund", "card"]):
            suggestions.extend([
                {"label": "Client Dashboard", "href": "/client"},
                {"label": "My Messages", "href": "/client/messages"},
            ])
        if any(k in text for k in ["message", "chat", "contact"]):
            suggestions.append({"label": "Client Messages", "href": "/client/messages"})
        if any(k in text for k in ["login", "signin", "sign in"]):
            suggestions.append({"label": "Sign In", "href": "/auth/signin"})
        if any(k in text for k in ["signup", "register", "sign up"]):
            suggestions.append({"label": "Sign Up", "href": "/auth/signup"})

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


def _fallback_reply(message: str, context: Optional[str]) -> ChatResponse:
    text = (message or "").lower().strip()
    if any(k in text for k in ["book", "session", "schedule", "reschedule"]):
        reply = (
            "To book: go to Trainers to pick a trainer, or use Optimal Scheduling for suggestions. "
            "Manage times in Client → Schedule."
        )
    elif any(k in text for k in ["pay", "payment", "refund"]):
        reply = (
            "Payments are simulated. Open your Client dashboard, select a booking, and click Pay Now."
        )
    elif any(k in text for k in ["trainer", "profile", "register"]):
        reply = (
            "Browse trainers on the Trainers page. Trainers complete setup at Trainer → Complete Registration."
        )
    elif any(k in text for k in ["help", "how", "where"]):
        reply = (
            "Browse Trainers at /trainers, book via Direct Booking or Optimal Scheduling, and manage sessions in /client."
        )
    else:
        reply = "I can guide you to trainers, bookings, payments, or messages. What do you need?"

    return ChatResponse(
        reply=reply,
        source="fallback",
        suggestions=_suggestions_for(message, context, user_role),
    )


@router.post("/message", response_model=ChatResponse)
async def chat_message(payload: ChatRequest) -> ChatResponse:
    # If no OpenAI key configured, return a simple helpful fallback
    if not settings.openai_api_key:
        return _fallback_reply(payload.message, payload.context)

    # Attempt OpenAI response; fail gracefully to fallback on any error
    try:
        # Lazy import to avoid hard dependency when no key is set
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        messages = [{"role": "system", "content": (
            "You are FitConnect's assistant. Be concise. If asked about bookings, trainers, payments, "
            "or scheduling, answer based on the platform's typical flows."
        )}]

        if payload.context:
            messages.append({"role": "system", "content": f"Context: {payload.context}"})

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
            return _fallback_reply(payload.message, payload.context)
        return ChatResponse(
            reply=reply,
            source="openai",
            suggestions=_suggestions_for(payload.message, payload.context, payload.user_role),
        )

    except Exception:
        return _fallback_reply(payload.message, payload.context)



