from flask import Blueprint, request, jsonify
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint("auth", __name__)

# In-memory user store (would be a database in production)
# Storing hashed passwords and using usernames instead of emails
USERS = {
    "admin": {"password": generate_password_hash("admin123"), "role": "admin", "subscription": "go", "email": "admin@example.com"},
    "manager": {"password": generate_password_hash("manager123"), "role": "admin", "subscription": "go", "email": "manager@example.com"},
    "user": {"password": generate_password_hash("user123"), "role": "user", "subscription": "free", "email": "user@example.com"},
    "chethang387": {"password": generate_password_hash("12345678"), "role": "admin", "subscription": "go", "email": "chethang387@gmail.com"},
}

@auth_bp.route("/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or {}
    username = payload.get("username", "").strip()
    password = payload.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password required."}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters long."}), 400

    if username in USERS:
        return jsonify({"error": "Username already exists."}), 409

    # For now, new users are standard users with free subscription
    USERS[username] = {
        "password": generate_password_hash(password),
        "role": "user",
        "subscription": "free",
        "email": f"{username}@example.com" # Mock email
    }
    return jsonify({
        "success": True,
        "message": "User registered successfully.",
        "username": username,
        "role": "user",
        "subscription": "free"
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}
    username = payload.get("username", "").strip()
    password = payload.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password required."}), 400

    user = USERS.get(username)
    if not user:
        username_from_email = next(
            (stored_username for stored_username, stored_user in USERS.items() if stored_user["email"].lower() == username.lower()),
            None
        )
        if username_from_email:
            username = username_from_email
            user = USERS[username]

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid username or password."}), 401

    return jsonify({
        "success": True,
        "username": username,
        "email": user["email"],
        "role": user["role"],
        "subscription": user["subscription"],
        "loginTime": datetime.now().isoformat()
    })

@auth_bp.route("/subscribe", methods=["POST"])
def subscribe():
    payload = request.get_json(silent=True) or {}
    username = payload.get("username", "").strip() # Changed from email to username
    plan = payload.get("plan", "free")

    if username not in USERS:
        return jsonify({"error": "User not found."}), 404

    USERS[username]["subscription"] = plan
    return jsonify({
        "success": True,
        "message": f"Upgraded to {plan} plan.",
        "subscription": plan
    })
