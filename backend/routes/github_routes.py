from flask import Blueprint, request, jsonify, redirect
from datetime import datetime
import os

github_bp = Blueprint("github", __name__)

# GitHub OAuth Configuration (would be set in environment variables in production)
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "your_github_client_id")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "your_github_client_secret")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:3000/auth/github/callback")

@github_bp.route("/login", methods=["GET"])
def github_login():
    """Redirect to GitHub OAuth login"""
    github_auth_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={GITHUB_CLIENT_ID}&"
        f"redirect_uri={GITHUB_REDIRECT_URI}&"
        f"scope=user:email"
    )
    return jsonify({
        "success": True,
        "auth_url": github_auth_url,
        "message": "Redirect to GitHub login"
    })


@github_bp.route("/callback", methods=["POST"])
def github_callback():
    """Handle GitHub OAuth callback"""
    payload = request.get_json(silent=True) or {}
    code = payload.get("code", "")
    
    if not code:
        return jsonify({"error": "No authorization code provided"}), 400
    
    # In production, exchange code for access token with GitHub API
    # For now, return success with mock user data
    return jsonify({
        "success": True,
        "email": "user@github.example.com",
        "github_username": "github_user_123",
        "role": "user",
        "subscription": "free",
        "loginTime": datetime.now().isoformat(),
        "message": "GitHub login successful (demo mode)"
    })


@github_bp.route("/connect", methods=["POST"])
def connect_github():
    """Connect GitHub account to existing user"""
    payload = request.get_json(silent=True) or {}
    email = payload.get("email", "")
    github_username = payload.get("github_username", "")
    
    if not email or not github_username:
        return jsonify({"error": "Email and GitHub username required"}), 400
    
    return jsonify({
        "success": True,
        "message": f"GitHub account {github_username} connected to {email}",
        "github_username": github_username,
        "email": email,
        "connected_at": datetime.now().isoformat()
    })


@github_bp.route("/disconnect", methods=["POST"])
def disconnect_github():
    """Disconnect GitHub account from user"""
    payload = request.get_json(silent=True) or {}
    email = payload.get("email", "")
    
    if not email:
        return jsonify({"error": "Email required"}), 400
    
    return jsonify({
        "success": True,
        "message": f"GitHub account disconnected from {email}"
    })
