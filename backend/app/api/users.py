import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user
from app.db.crud.user import update_user
from app.db.crud.schedule import get_user_schedule, create_schedule
from app.schema.user import UserUpdate, UserResponse, UserPreferences, PublicUserProfile, ProfileResponse, GenderPreference, MusicPreference, ConversationPreference, SmokingPreference
from app.schema.schedule import ScheduleCreate, ScheduleResponse
from app.db.models.ride import Ride
from app.db.models.ride_history import RideHistory
from app.db.models.user import User

router = APIRouter()


@router.get("/preferences/options")
async def get_preference_options():
    """
    Get all available preference options for user selection
    """
    return {
        "gender_preferences": [option.value for option in GenderPreference],
        "music_preferences": [option.value for option in MusicPreference],
        "conversation_preferences": [option.value for option in ConversationPreference],
        "smoking_preferences": [option.value for option in SmokingPreference]
    }


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Count rides taken (where user is passenger)
    rides_taken = db.query(RideHistory).filter(
        RideHistory.user_id == current_user.id
    ).count()
    
    # Count rides offered (where user is driver)
    rides_offered = db.query(Ride).filter(
        Ride.driver_id == current_user.id
    ).count()

    driver_rating = 0.0
    if rides_offered > 0:
        result = db.query(
            func.avg(func.coalesce(RideHistory.rating_given, 5))
        ).join(
            Ride, RideHistory.ride_id == Ride.id
        ).filter(
            Ride.driver_id == current_user.id
        ).scalar()
        driver_rating = float(result) if result is not None else 0.0

    rider_rating = 0.0
    if rides_taken > 0:
        result = db.query(
            func.avg(func.coalesce(RideHistory.rating_received, 5))
        ).filter(
            RideHistory.user_id == current_user.id
        ).scalar()
        rider_rating = float(result) if result is not None else 0.0
    
    # Handle preferences conversion from JSON to UserPreferences object
    preferences_obj = None
    if current_user.preferences:
        try:
            if isinstance(current_user.preferences, str):
                preferences_data = json.loads(current_user.preferences)
            else:
                preferences_data = current_user.preferences
            preferences_obj = UserPreferences(**preferences_data)
        except (json.JSONDecodeError, TypeError, ValueError):
            # If preferences data is invalid, set to None
            preferences_obj = None
    
    profile_data = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "bio": current_user.bio,
        "gender": current_user.gender,
        "photo_url": current_user.photo_url,
        "is_driver": current_user.is_driver,
        "is_rider": current_user.is_rider,
        # include all other fields you need
        "rides_taken": rides_taken,
        "rides_offered": rides_offered,
        "preferences": preferences_obj,
        "driver_rating": driver_rating,
        "rider_rating": rider_rating
    }
    
    return profile_data


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    update_data = user_update.dict(exclude_unset=True)
    if 'preferences' in update_data:
        if isinstance(update_data['preferences'], dict):
            update_data['preferences'] = json.dumps(update_data['preferences'])
    
    updated_user = update_user(db, current_user.id, update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user


@router.get("/schedule", response_model=List[ScheduleResponse])
async def get_schedule(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_user_schedule(db, current_user.id)


@router.post("/schedule", response_model=ScheduleResponse)
async def create_user_schedule(
    schedule: ScheduleCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return create_schedule(db, schedule.dict(), current_user.id)

@router.get("/profile/{user_id}", response_model=PublicUserProfile)
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    rides_taken = db.query(RideHistory).filter(
        RideHistory.user_id == user_id
    ).count()

    rides_offered = db.query(Ride).filter(
        Ride.driver_id == user_id
    ).count()


    return {
        "id": user.id,
        "name": user.name,
        "bio": user.bio,
        "photo_url": user.photo_url,
        "rides_taken": rides_taken,
        "rides_offered": rides_offered,
    }