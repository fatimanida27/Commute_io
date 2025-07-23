from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db, engine
from app.db.models.user import User
from app.db.models.car import Car
from app.db.models.ride import Ride
from app.db.models.recurring_ride import RecurringRide
from app.db.models.message import Message
from app.db.models.location import PreferredLocation
from app.db.models.schedule import Schedule
from passlib.context import CryptContext
from datetime import datetime, timedelta, time
import logging

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def seed_database():
    """Populate database with initial data if it's empty"""
    db = next(get_db())
    
    try:
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            logger.info(f"Database already has {existing_users} users, skipping seeding")
            return
        
        logger.info("Seeding database with initial data...")
        
        # Create demo users
        users_data = [
            {
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "name": "John Doe",
                "bio": "Daily commuter from Stanford to SF",
                "is_driver": True,
                "is_rider": True,
                "gender": "male",
                "hashed_password": hash_password("password123"),
                "email_verified": True,
                "phone_verified": True,
            },
            {
                "email": "jane.smith@example.com", 
                "phone": "+1234567891",
                "name": "Jane Smith",
                "bio": "Tech professional, love carpooling",
                "is_driver": True,
                "is_rider": True,
                "gender": "female",
                "hashed_password": hash_password("password123"),
                "email_verified": True,
                "phone_verified": True,
            },
            {
                "email": "mike.wilson@example.com",
                "phone": "+1234567892", 
                "name": "Mike Wilson",
                "bio": "Student at Stanford University",
                "is_driver": False,
                "is_rider": True,
                "gender": "male",
                "hashed_password": hash_password("password123"),
                "email_verified": True,
                "phone_verified": True,
            },
            {
                "email": "sarah.jones@example.com",
                "phone": "+1234567893",
                "name": "Sarah Jones", 
                "bio": "Environmental advocate, prefer eco-friendly travel",
                "is_driver": True,
                "is_rider": True,
                "gender": "female",
                "hashed_password": hash_password("password123"),
                "email_verified": True,
                "phone_verified": True,
            }
        ]
        
        users = []
        for user_data in users_data:
            user = User(**user_data)
            db.add(user)
            users.append(user)
        
        db.commit()
        
        # Refresh to get IDs
        for user in users:
            db.refresh(user)
        
        # Create cars for drivers
        cars_data = [
            {
                "user_id": users[0].id,  # John Doe
                "make": "Tesla",
                "model": "Model 3",
                "year": 2022,
                "color": "White",
                "license_plate": "TES123",
                "seats": 5,
                "ac_available": True,
            },
            {
                "user_id": users[1].id,  # Jane Smith
                "make": "Honda",
                "model": "Civic",
                "year": 2021,
                "color": "Blue", 
                "license_plate": "HON456",
                "seats": 5,
                "ac_available": True,
            },
            {
                "user_id": users[3].id,  # Sarah Jones
                "make": "Toyota",
                "model": "Prius",
                "year": 2023,
                "color": "Silver",
                "license_plate": "TOY789",
                "seats": 5,
                "ac_available": True,
            }
        ]
        
        cars = []
        for car_data in cars_data:
            car = Car(**car_data)
            db.add(car)
            cars.append(car)
        
        db.commit()
        
        # Refresh to get IDs
        for car in cars:
            db.refresh(car)
        
        # Create rides
        now = datetime.now()
        rides_data = [
            {
                "driver_id": users[0].id,
                "car_id": cars[0].id,
                "start_location": "Stanford University",
                "end_location": "San Francisco Downtown",
                "start_time": now + timedelta(hours=2),
                "seats_available": 3,
                "total_fare": 25.0,
                "status": "active",
            },
            {
                "driver_id": users[1].id,
                "car_id": cars[1].id,
                "start_location": "Palo Alto",
                "end_location": "Mountain View",
                "start_time": now + timedelta(hours=4),
                "seats_available": 2,
                "total_fare": 15.0,
                "status": "active",
            },
            {
                "driver_id": users[3].id,
                "car_id": cars[2].id,
                "start_location": "San Jose",
                "end_location": "Stanford University",
                "start_time": now + timedelta(days=1, hours=1),
                "seats_available": 4,
                "total_fare": 20.0,
                "status": "active",
            }
        ]
        
        rides = []
        for ride_data in rides_data:
            ride = Ride(**ride_data)
            db.add(ride)
            rides.append(ride)
        
        db.commit()
        
        # Refresh to get IDs
        for ride in rides:
            db.refresh(ride)
        
        # Create recurring rides
        recurring_rides_data = [
            {
                "driver_id": users[0].id,
                "car_id": cars[0].id,
                "start_location": "Stanford University",
                "end_location": "San Francisco Downtown",
                "day_of_week": 1,  # Tuesday
                "start_time": time(8, 0),
                "seats_available": 3,
                "total_fare": 25.0,
                "schedule_type": "weekly",
                "status": "active",
            },
            {
                "driver_id": users[1].id,
                "car_id": cars[1].id,
                "start_location": "Palo Alto",
                "end_location": "Mountain View",
                "day_of_week": 4,  # Friday
                "start_time": time(18, 30),
                "seats_available": 2,
                "total_fare": 15.0,
                "schedule_type": "weekly",
                "status": "active",
            }
        ]
        
        for recurring_ride_data in recurring_rides_data:
            recurring_ride = RecurringRide(**recurring_ride_data)
            db.add(recurring_ride)
        
        db.commit()
        
        # Create messages
        messages_data = [
            {
                "sender_id": users[2].id,  # Mike to John
                "receiver_id": users[0].id,
                "content": "Hi! I'm interested in your ride to SF tomorrow. What time should we meet?",
                "ride_id": rides[0].id,
            },
            {
                "sender_id": users[0].id,  # John to Mike
                "receiver_id": users[2].id,
                "content": "Great! Let's meet at the Stanford main entrance at 7:45 AM",
                "ride_id": rides[0].id,
            },
            {
                "sender_id": users[2].id,  # Mike to John
                "receiver_id": users[0].id,
                "content": "Perfect! See you then. I'll be wearing a blue jacket.",
                "ride_id": rides[0].id,
            }
        ]
        
        for message_data in messages_data:
            message = Message(**message_data)
            db.add(message)
        
        db.commit()
        
        # Create preferred locations
        locations_data = [
            {
                "user_id": users[0].id,
                "name": "Stanford University",
                "address": "450 Serra Mall, Stanford, CA 94305",
                "latitude": 37.4275,
                "longitude": -122.1697,
            },
            {
                "user_id": users[0].id,
                "name": "SF Downtown",
                "address": "Market St, San Francisco, CA",
                "latitude": 37.7749,
                "longitude": -122.4194,
            },
            {
                "user_id": users[1].id,
                "name": "Palo Alto Caltrain",
                "address": "95 University Ave, Palo Alto, CA",
                "latitude": 37.4436,
                "longitude": -122.1651,
            }
        ]
        
        for location_data in locations_data:
            location = PreferredLocation(**location_data)
            db.add(location)
        
        db.commit()
        
        # Create schedules
        schedules_data = [
            {
                "user_id": users[0].id,
                "day_of_week": 1,  # Tuesday
                "start_time": time(7, 30),
                "end_time": time(9, 0),
            },
            {
                "user_id": users[0].id,
                "day_of_week": 4,  # Friday
                "start_time": time(17, 0),
                "end_time": time(19, 0),
            },
            {
                "user_id": users[1].id,
                "day_of_week": 1,  # Tuesday
                "start_time": time(8, 0),
                "end_time": time(18, 0),
            }
        ]
        
        for schedule_data in schedules_data:
            schedule = Schedule(**schedule_data)
            db.add(schedule)
        
        db.commit()
        
        logger.info("Database seeding completed successfully!")
        logger.info(f"Created {len(users)} users, {len(cars)} cars, {len(rides)} rides")
        
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()