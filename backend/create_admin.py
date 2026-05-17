from auth import get_password_hash
from database import users

email = "admin@omni.com"
password = "123"

# Check if exists
if not users.find_one({"email": email}):
    hashed = get_password_hash(password)
    users.insert_one({"email": email, "hashed_password": hashed})
    print("User created successfully!")
else:
    print("User already exists.")
