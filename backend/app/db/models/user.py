from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=True)
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    gender = Column(String, nullable=True)
    photo_url = Column(Text, nullable=True)
    bio = Column(Text, nullable=True)
    is_driver = Column(Boolean, nullable=False, default=False)
    is_rider = Column(Boolean, nullable=False, default=True)
    trust_score = Column(Float, default=0.0)
    preferences = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cars = relationship("Car", back_populates="user")
    driver_rides = relationship("Ride", foreign_keys="Ride.driver_id", back_populates="driver")
    ride_requests = relationship("RideRequest", back_populates="rider")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    preferred_locations = relationship("PreferredLocation", back_populates="user")
    schedules = relationship("Schedule", back_populates="user")
    ride_history = relationship("RideHistory", back_populates="user")
