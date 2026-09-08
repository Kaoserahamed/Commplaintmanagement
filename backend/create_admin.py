"""
Create initial admin user for Bangladesh Civic Complaint Management System
Run this script once to create the first admin account.
"""
from app.database import SessionLocal
from app.models import Admin
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_admin():
    """Create initial admin user"""
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing = db.query(Admin).filter(Admin.username == "admin").first()
        if existing:
            print("❌ Admin user 'admin' already exists!")
            print(f"   Email: {existing.email}")
            print(f"   Active: {existing.is_active}")
            return
        
        # Create admin user
        admin = Admin(
            username="admin",
            email="admin@example.com",
            password_hash=pwd_context.hash("admin123"),  # Default password
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        
        print("✅ Admin user created successfully!")
        print("\n" + "="*50)
        print("📝 ADMIN CREDENTIALS")
        print("="*50)
        print(f"Username: admin")
        print(f"Password: admin123")
        print(f"Email:    admin@example.com")
        print("="*50)
        print("\n⚠️  IMPORTANT: Change this password immediately after first login!")
        print("   Use a strong password (min 12 characters, mix of letters/numbers/symbols)\n")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("Creating admin user for Bangladesh Civic Complaint Management System...")
    print()
    create_admin()
