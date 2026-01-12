"""
Tessolve Executive Portal - AI API Endpoints
Handles AI assistant interactions.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import os

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.ai_service import AIService
from app.config import settings


router = APIRouter(prefix="/ai", tags=["AI Assistant"])


# Request/Response Models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = None


class ChatResponse(BaseModel):
    response: str
    success: bool = True


class SummaryRequest(BaseModel):
    service_id: int


class SummaryResponse(BaseModel):
    summary: str
    success: bool = True


class InsightResponse(BaseModel):
    insight: str
    success: bool = True


def get_ai_service(db: Session = Depends(get_db)) -> AIService:
    """Get AI service instance with API key."""
    api_key = os.getenv("ANTHROPIC_API_KEY") or settings.ANTHROPIC_API_KEY
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="AI service not configured. Please set ANTHROPIC_API_KEY."
        )
    return AIService(db, api_key)


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends(get_ai_service),
):
    """
    Chat with AI assistant.
    Send a message and get an intelligent response based on your services data.
    """
    try:
        # Convert conversation history to dict format
        history = None
        if request.conversation_history:
            history = [{"role": m.role, "content": m.content} for m in request.conversation_history]
        
        response = ai_service.chat(
            message=request.message,
            conversation_history=history,
            user=current_user
        )
        
        return ChatResponse(response=response, success=True)
    except Exception as e:
        return ChatResponse(response=f"Error: {str(e)}", success=False)


@router.post("/service-summary", response_model=SummaryResponse)
async def get_service_summary(
    request: SummaryRequest,
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends(get_ai_service),
):
    """
    Generate an AI summary for a specific service.
    """
    try:
        summary = ai_service.generate_service_summary(request.service_id)
        return SummaryResponse(summary=summary, success=True)
    except Exception as e:
        return SummaryResponse(summary=f"Error: {str(e)}", success=False)


@router.get("/risk-analysis", response_model=InsightResponse)
async def get_risk_analysis(
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends(get_ai_service),
):
    """
    Get AI-powered risk analysis of all services.
    """
    try:
        analysis = ai_service.analyze_risks()
        return InsightResponse(insight=analysis, success=True)
    except Exception as e:
        return InsightResponse(insight=f"Error: {str(e)}", success=False)


@router.get("/suggestions", response_model=InsightResponse)
async def get_suggestions(
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends(get_ai_service),
):
    """
    Get AI-powered action suggestions based on current data.
    """
    try:
        role_name = current_user.role.display_name if current_user.role else "Manager"
        suggestions = ai_service.suggest_actions(role_name)
        return InsightResponse(insight=suggestions, success=True)
    except Exception as e:
        return InsightResponse(insight=f"Error: {str(e)}", success=False)


@router.get("/status")
async def ai_status():
    """Check if AI service is configured."""
    api_key = os.getenv("ANTHROPIC_API_KEY") or getattr(settings, 'ANTHROPIC_API_KEY', None)
    return {
        "configured": bool(api_key),
        "model": "claude-sonnet-4-20250514"
    }
