from .resume_routes import resume_bp
from .health_routes import health_bp
from .auth_routes import auth_bp
from .github_routes import github_bp

__all__ = ["resume_bp", "health_bp", "auth_bp", "github_bp"]
