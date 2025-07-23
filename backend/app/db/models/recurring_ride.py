from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class RecurringRide(Base):
    __tablename__ = "recurring_rides"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    car_id = Column(Integer, ForeignKey("cars.id"), nullable=False)
    start_location = Column(String, nullable=False)
    end_location = Column(String, nullable=False)
    
    # Schedule information
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    
    # Ride details
    seats_available = Column(Integer, nullable=False)
    total_fare = Column(Float, nullable=False)
    
    # Schedule type
    schedule_type = Column(String, nullable=False, default="weekly")  # weekly, daily, custom
    
    # Status and metadata
    status = Column(String, nullable=False, default="active")  # active, paused, cancelled
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    driver = relationship("User", foreign_keys=[driver_id])
    car = relationship("Car")