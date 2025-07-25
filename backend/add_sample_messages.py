#!/usr/bin/env python3
"""
Script to add sample messages to the database for testing
"""
import sys
import os
from datetime import datetime, timedelta

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.db.models.message import Message
from app.db.models.user import User

def add_sample_messages():
    db = SessionLocal()
    
    try:
        # Get some users from the database
        users = db.query(User).limit(4).all()
        
        if len(users) < 2:
            print("Need at least 2 users in the database to create messages")
            return
        
        # Create sample messages between users
        sample_messages = [
            {
                'sender_id': users[0].id,
                'receiver_id': users[1].id,
                'content': 'Hi! Are you available for the ride tomorrow?',
                'sent_at': datetime.now() - timedelta(hours=2)
            },
            {
                'sender_id': users[1].id,
                'receiver_id': users[0].id,
                'content': 'Yes, I can pick you up at 8 AM. Is that okay?',
                'sent_at': datetime.now() - timedelta(hours=1, minutes=30)
            },
            {
                'sender_id': users[0].id,
                'receiver_id': users[1].id,
                'content': 'Perfect! See you tomorrow.',
                'sent_at': datetime.now() - timedelta(hours=1)
            }
        ]
        
        if len(users) >= 3:
            sample_messages.extend([
                {
                    'sender_id': users[0].id,
                    'receiver_id': users[2].id,
                    'content': 'Hey, do you need a ride to the downtown area?',
                    'sent_at': datetime.now() - timedelta(minutes=30)
                },
                {
                    'sender_id': users[2].id,
                    'receiver_id': users[0].id,
                    'content': 'That would be great! What time?',
                    'sent_at': datetime.now() - timedelta(minutes=15)
                }
            ])
        
        # Add messages to database
        for msg_data in sample_messages:
            message = Message(**msg_data)
            db.add(message)
        
        db.commit()
        print(f"Added {len(sample_messages)} sample messages successfully!")
        
        # Print the messages for verification
        print("\nSample messages added:")
        for i, msg_data in enumerate(sample_messages, 1):
            sender = db.query(User).filter(User.id == msg_data['sender_id']).first()
            receiver = db.query(User).filter(User.id == msg_data['receiver_id']).first()
            print(f"{i}. {sender.name} -> {receiver.name}: {msg_data['content']}")
            
    except Exception as e:
        print(f"Error adding sample messages: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_sample_messages()