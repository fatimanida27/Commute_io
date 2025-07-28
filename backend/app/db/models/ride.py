from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Ride(Base):
    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=False)
    start_location = Column(String, nullable=False)  # String field as expected by PostgreSQL
    end_location = Column(String, nullable=False)    # String field as expected by PostgreSQL
    # Add coordinate fields for map integration
    start_latitude = Column(Float, nullable=True)    # Start location latitude
    start_longitude = Column(Float, nullable=True)   # Start location longitude
    end_latitude = Column(Float, nullable=True)      # End location latitude
    end_longitude = Column(Float, nullable=True)     # End location longitude
    distance_km = Column(Float, nullable=True)       # Calculated distance in kilometers
    estimated_duration = Column(Integer, nullable=True)  # Estimated duration in minutes
    start_time = Column(DateTime, nullable=False)
    seats_available = Column(Integer, nullable=False)
    total_fare = Column(Float, nullable=True)        # Added as used in CRUD
    status = Column(String, nullable=False, default="active")  # pending, confirmed, in_progress, completed, cancelled

    # Relationships
    driver = relationship("User", foreign_keys=[driver_id], back_populates="driver_rides")
    car = relationship("Car", back_populates="rides")
    ride_requests = relationship("RideRequest", back_populates="ride")
    messages = relationship("Message", back_populates="ride")