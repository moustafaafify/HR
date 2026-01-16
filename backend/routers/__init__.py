"""Routers package for HR Platform."""
from .visitors import router as visitors_router
from .compliance import router as compliance_router
from .workforce import router as workforce_router
from .scheduled_reports import router as scheduled_reports_router

__all__ = ['visitors_router', 'compliance_router', 'workforce_router', 'scheduled_reports_router']
