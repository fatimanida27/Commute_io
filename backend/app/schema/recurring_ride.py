from pydantic import BaseModel
from typing import Optional
from datetime import time, datetime

from app.schema.car import CarResponse
from app.schema.user import UserResponse


class RecurringRideBase(BaseModel):
    car_id: int
    start_location: str
    end_location: str
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: time
    seats_available: int
    total_fare: float
    schedule_type: str = "weekly"


class RecurringRideCreate(RecurringRideBase):
    pass


class RecurringRideUpdate(BaseModel):
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    seats_available: Optional[int] = None
    total_fare: Optional[float] = None
    status: Optional[str] = None


class RecurringRideResponse(RecurringRideBase):
    id: int
    driver_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    driver: Optional[UserResponse] = None
    car: Optional[CarResponse] = None

    class Config:
        from_attributes = True


class DayOfWeekOption(BaseModel):
    value: int
    label: str


class ScheduleOption(BaseModel):
    value: str
    label: str