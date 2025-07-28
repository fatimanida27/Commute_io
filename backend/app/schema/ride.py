from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.schema.car import CarResponse
from app.schema.user import UserResponse

class RideBase(BaseModel):
    car_id: int
    start_location: str
    end_location: str
    # Add coordinate fields for map integration
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    end_latitude: Optional[float] = None
    end_longitude: Optional[float] = None
    distance_km: Optional[float] = None
    estimated_duration: Optional[int] = None
    start_time: datetime
    seats_available: int
    total_fare: Optional[float] = None


class RideCreate(RideBase):
    pass


class RideUpdate(BaseModel):
    start_time: Optional[datetime] = None
    seats_available: Optional[int] = None
    status: Optional[str] = None


class RideResponse(RideBase):
    id: int
    driver_id: int
    status: str
    driver: UserResponse
    car: CarResponse
    
    class Config:
        from_attributes = True


class RideRequestCreate(BaseModel):
    ride_id: int
    message: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    name: str
    photo_url: Optional[str] = None
    rating: Optional[float] = None
    rides_taken: Optional[int] = None

    class Config:
        from_attributes = True

class RidePublic(BaseModel):
    id: int
    start_location: str
    end_location: str
    start_time: datetime
    seats_available: int
    total_fare: float

    class Config:
        from_attributes = True

class RideRequestResponse(BaseModel):
    id: int
    rider_id: int
    ride_id: int
    status: str
    requested_at: datetime
    message: Optional[str] = None
    rider: UserPublic
    ride: RidePublic

    class Config:
        from_attributes = True


class RideRequestUpdate(BaseModel):
    status: str  # accepted, rejected


class RideHistoryResponse(BaseModel):
    id: int
    user_id: int
    ride_id: int
    role: str  # driver, rider
    joined_at: datetime
    completed_at: Optional[datetime] = None
    rating_given: Optional[int] = None
    rating_received: Optional[int] = None
    # Add ride details for frontend
    ride: Optional["RideResponse"] = None

    class Config:
        from_attributes = True

class RideHistoryUpdateRequest(BaseModel):
    rating_received: Optional[int] = None

class RiderHistoryUpdateRequest(BaseModel):
    rating_given: Optional[int] = None

class RideHistoryCreate(BaseModel):
    user_id: int
    ride_id: int
    role: str  # "driver" or "rider"