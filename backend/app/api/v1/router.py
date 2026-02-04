"""
Tessolve Executive Portal - API v1 Router
Aggregates all API endpoints under /api/v1 prefix.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.services import router as services_router
from app.api.v1.master_data import router as master_data_router
from app.api.v1.settings import router as settings_router
from app.api.v1.ai import router as ai_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.clients import router as clients_router
from app.api.v1.employees import router as employees_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.inquiries import router as inquiries_router
from app.api.v1.dashboard import router as dashboard_router


# Main API router
api_router = APIRouter()

# Include all sub-routers
api_router.include_router(auth_router)
api_router.include_router(admin_router)
api_router.include_router(dashboard_router)
api_router.include_router(clients_router)
api_router.include_router(services_router)
api_router.include_router(master_data_router)
api_router.include_router(settings_router)
api_router.include_router(ai_router)
api_router.include_router(inventory_router)
api_router.include_router(employees_router)
api_router.include_router(tasks_router)
api_router.include_router(inquiries_router)

# Health check endpoint
@api_router.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "healthy",
        "service": "Tessolve Executive Portal API",
        "version": "1.0.0",
    }
