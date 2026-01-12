"""
Tessolve Executive Portal - AI Service
Integration with Claude API for intelligent assistance.
"""

import anthropic
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal

from app.models.service import Service, ServiceStatus, CustomerType
from app.models.master_data import Sector, Technology, EngagementModel, ServiceCategory
from app.models.user import User


class AIService:
    """Service for AI-powered features using Claude API."""
    
    def __init__(self, db: Session, api_key: str):
        self.db = db
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"
    
    def _get_services_context(self) -> str:
        """Get current services data as context for Claude."""
        services = self.db.query(Service).filter(Service.is_deleted == 0).all()
        
        if not services:
            return "No services currently in the system."
        
        # Build summary
        total_services = len(services)
        total_value = sum(s.contract_value or 0 for s in services)
        
        status_counts = {}
        for s in services:
            status = s.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
        
        customer_type_counts = {}
        for s in services:
            ct = s.customer_type.value
            customer_type_counts[ct] = customer_type_counts.get(ct, 0) + 1
        
        # Service details
        service_details = []
        for s in services:
            detail = f"- {s.name}: Customer={s.customer_name}, Status={s.status.value}, Value=${s.contract_value or 0:,.2f}, Resources={s.resource_count or 0}"
            if s.sector:
                detail += f", Sector={s.sector.name}"
            service_details.append(detail)
        
        context = f"""
CURRENT SERVICES DATA:
======================
Total Services: {total_services}
Total Contract Value: ${total_value:,.2f}

Status Breakdown:
{chr(10).join(f'- {k}: {v}' for k, v in status_counts.items())}

Customer Types:
{chr(10).join(f'- {k}: {v}' for k, v in customer_type_counts.items())}

Service Details:
{chr(10).join(service_details)}
"""
        return context
    
    def _get_analytics_context(self) -> str:
        """Get analytics data as context."""
        services = self.db.query(Service).filter(Service.is_deleted == 0).all()
        
        if not services:
            return "No analytics data available."
        
        # Calculate metrics
        total_value = sum(s.contract_value or 0 for s in services)
        total_resources = sum(s.resource_count or 0 for s in services)
        avg_value = total_value / len(services) if services else 0
        
        # Top customers by value
        customer_values = {}
        for s in services:
            customer_values[s.customer_name] = customer_values.get(s.customer_name, 0) + (s.contract_value or 0)
        top_customers = sorted(customer_values.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Services by sector
        sector_counts = {}
        for s in services:
            sector_name = s.sector.name if s.sector else "Unassigned"
            sector_counts[sector_name] = sector_counts.get(sector_name, 0) + 1
        
        context = f"""
ANALYTICS SUMMARY:
==================
Total Contract Value: ${total_value:,.2f}
Average Service Value: ${avg_value:,.2f}
Total Resources Allocated: {total_resources}

Top Customers by Value:
{chr(10).join(f'- {name}: ${value:,.2f}' for name, value in top_customers)}

Services by Sector:
{chr(10).join(f'- {k}: {v}' for k, v in sector_counts.items())}
"""
        return context

    def chat(
        self, 
        message: str, 
        conversation_history: List[Dict[str, str]] = None,
        user: Optional[User] = None
    ) -> str:
        """
        Chat with Claude AI assistant.
        
        Args:
            message: User's message
            conversation_history: Previous messages in conversation
            user: Current user for context
            
        Returns:
            AI response
        """
        # Build system prompt with context
        services_context = self._get_services_context()
        analytics_context = self._get_analytics_context()
        
        user_context = ""
        if user:
            user_context = f"\nCurrent User: {user.full_name} (Role: {user.role.display_name})"
        
        system_prompt = f"""You are an intelligent AI assistant for the Tessolve Executive Portal, a service management platform. Your role is to help managers and executives understand their services data, provide insights, and answer questions.

{user_context}

{services_context}

{analytics_context}

CAPABILITIES:
- Answer questions about services, customers, and projects
- Provide analytics and insights
- Suggest actions and recommendations
- Help with decision making
- Generate summaries and reports

GUIDELINES:
- Be concise and professional
- Use data from the context provided
- If asked about data not in context, say you don't have that information
- Provide actionable insights when possible
- Format numbers nicely (use commas, currency symbols)
- If asked to perform actions (create, delete, update), explain that you can only provide information and recommendations

Remember: You have access to real-time data from the Tessolve Executive Portal."""

        # Build messages
        messages = []
        
        if conversation_history:
            for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        messages.append({
            "role": "user",
            "content": message
        })
        
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=messages
            )
            
            return response.content[0].text
        except anthropic.APIError as e:
            return f"I apologize, but I encountered an error: {str(e)}. Please try again."
        except Exception as e:
            return f"An unexpected error occurred: {str(e)}"
    
    def generate_service_summary(self, service_id: int) -> str:
        """Generate an AI summary for a specific service."""
        service = self.db.query(Service).filter(
            Service.id == service_id,
            Service.is_deleted == 0
        ).first()
        
        if not service:
            return "Service not found."
        
        prompt = f"""Generate a brief executive summary for this service:

Service Name: {service.name}
Customer: {service.customer_name}
Status: {service.status.value}
Contract Value: ${service.contract_value or 0:,.2f}
Resources: {service.resource_count or 0}
Sector: {service.sector.name if service.sector else 'Not specified'}
Category: {service.service_category.name if service.service_category else 'Not specified'}
Start Date: {service.start_date or 'Not set'}
End Date: {service.end_date or 'Not set'}
Description: {service.description or 'No description'}

Provide a 2-3 sentence executive summary highlighting key points and any recommendations."""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=256,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            return f"Could not generate summary: {str(e)}"
    
    def analyze_risks(self) -> str:
        """Analyze services for potential risks."""
        services = self.db.query(Service).filter(Service.is_deleted == 0).all()
        
        if not services:
            return "No services to analyze."
        
        # Build service data for analysis
        service_data = []
        for s in services:
            service_data.append({
                "name": s.name,
                "customer": s.customer_name,
                "status": s.status.value,
                "value": float(s.contract_value or 0),
                "resources": s.resource_count or 0,
                "has_end_date": s.end_date is not None,
                "sector": s.sector.name if s.sector else None
            })
        
        prompt = f"""Analyze these services for potential risks and issues:

{service_data}

Identify:
1. Services that might be at risk (on hold, no end date, understaffed, etc.)
2. Customer concentration risks
3. Resource allocation concerns
4. Any other potential issues

Provide a brief risk assessment with specific recommendations."""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            return f"Could not analyze risks: {str(e)}"
    
    def suggest_actions(self, user_role: str) -> str:
        """Suggest actions based on current data."""
        services_context = self._get_services_context()
        analytics_context = self._get_analytics_context()
        
        prompt = f"""Based on the current services data, suggest 3-5 actionable items for a {user_role}.

{services_context}

{analytics_context}

Provide specific, actionable recommendations that would help improve service delivery, customer satisfaction, or business outcomes."""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except Exception as e:
            return f"Could not generate suggestions: {str(e)}"
