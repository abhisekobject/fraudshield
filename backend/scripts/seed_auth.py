import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import bcrypt
from app.database.session import SessionLocal
from app.database.models.admin import AdminUser

USERS = [
    {"username": "pratyushsahoo", "pswd": "pratyush@123"},
    {"username": "abhisekpatra", "pswd": "abhisek@123"},
    {"username": "shubhashreepanda", "pswd": "shubhashree@123"},
    {"username": "hariomnanda", "pswd": "hariom@123"},
    {"username": "dharmeshpati", "pswd": "dharmesh@123"},
    {"username": "dipankarswain", "pswd": "dipankar@123"},
]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_users():
    db = SessionLocal()
    try:
        # Add Guest user
        guest = db.query(AdminUser).filter(AdminUser.username == "guest").first()
        if not guest:
            guest = AdminUser(username="guest", password_hash=None, role="guest")
            db.add(guest)
            print("Added guest user.")

        # Add specific team members
        for user_data in USERS:
            user = db.query(AdminUser).filter(AdminUser.username == user_data["username"]).first()
            if not user:
                hashed_password = hash_password(user_data["pswd"])
                new_user = AdminUser(
                    username=user_data["username"],
                    password_hash=hashed_password,
                    role="admin"
                )
                db.add(new_user)
                print(f"Added user {user_data['username']}.")
            else:
                print(f"User {user_data['username']} already exists.")
        
        db.commit()
        print("Seed complete.")
    except Exception as e:
        print(f"Error seeding users: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
