from datetime import datetime
import os
from urllib.parse import urlencode

import requests
from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash

from routes.auth_routes import USERS, public_profile

github_bp = Blueprint("github", __name__)

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "your_github_client_id")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "your_github_client_secret")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:3000/auth/github/callback")


def _github_configured():
    return (
        GITHUB_CLIENT_ID
        and GITHUB_CLIENT_SECRET
        and GITHUB_CLIENT_ID != "your_github_client_id"
        and GITHUB_CLIENT_SECRET != "your_github_client_secret"
    )


def _github_headers(token=None):
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _get_primary_email(token, fallback_email):
    email_response = requests.get(
        "https://api.github.com/user/emails",
        headers=_github_headers(token),
        timeout=10,
    )
    if not email_response.ok:
        return fallback_email

    emails = email_response.json()
    primary = next((item for item in emails if item.get("primary") and item.get("verified")), None)
    verified = next((item for item in emails if item.get("verified")), None)
    selected = primary or verified
    return selected.get("email") if selected else fallback_email


def _find_or_create_user(github_user, email):
    github_username = github_user.get("login", "").strip()
    if not github_username:
        raise ValueError("GitHub profile did not include a username.")

    matched_username = next(
        (
            stored_username
            for stored_username, stored_user in USERS.items()
            if stored_user.get("email", "").lower() == (email or "").lower()
        ),
        None,
    )

    username = matched_username or f"github_{github_username}".lower()
    USERS.setdefault(
        username,
        {
            "password": generate_password_hash(os.urandom(24).hex()),
            "role": "user",
            "subscription": "free",
            "email": email or f"{github_username}@users.noreply.github.com",
        },
    )
    USERS[username]["github_username"] = github_username
    return username, USERS[username]


@github_bp.route("/login", methods=["GET"])
def github_login():
    """Return the GitHub OAuth authorization URL."""
    if not _github_configured():
        return jsonify({
            "error": "GitHub OAuth is not configured.",
            "fix": "Set GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_REDIRECT_URI before using GitHub login.",
        }), 503

    params = urlencode({
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "scope": "read:user user:email",
    })
    return jsonify({
        "success": True,
        "auth_url": f"https://github.com/login/oauth/authorize?{params}",
        "message": "Redirect to GitHub login",
    })


@github_bp.route("/callback", methods=["POST"])
def github_callback():
    """Exchange the OAuth code for a GitHub profile and app user."""
    if not _github_configured():
        return jsonify({"error": "GitHub OAuth is not configured."}), 503

    payload = request.get_json(silent=True) or {}
    code = payload.get("code", "")
    if not code:
        return jsonify({"error": "No authorization code provided"}), 400

    token_response = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": GITHUB_REDIRECT_URI,
        },
        timeout=10,
    )
    token_payload = token_response.json()
    access_token = token_payload.get("access_token")
    if not token_response.ok or not access_token:
        return jsonify({
            "error": token_payload.get("error_description") or "Unable to complete GitHub login.",
        }), 401

    user_response = requests.get(
        "https://api.github.com/user",
        headers=_github_headers(access_token),
        timeout=10,
    )
    if not user_response.ok:
        return jsonify({"error": "Unable to read GitHub profile."}), 401

    github_user = user_response.json()
    email = _get_primary_email(access_token, github_user.get("email"))
    username, app_user = _find_or_create_user(github_user, email)

    return jsonify({
        **public_profile(username, app_user),
        "loginTime": datetime.now().isoformat(),
        "message": "GitHub login successful",
    })


@github_bp.route("/connect", methods=["POST"])
def connect_github():
    """Connect GitHub account to existing user."""
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
        "connected_at": datetime.now().isoformat(),
    })


@github_bp.route("/disconnect", methods=["POST"])
def disconnect_github():
    """Disconnect GitHub account from user."""
    payload = request.get_json(silent=True) or {}
    email = payload.get("email", "")

    if not email:
        return jsonify({"error": "Email required"}), 400

    return jsonify({
        "success": True,
        "message": f"GitHub account disconnected from {email}",
    })
