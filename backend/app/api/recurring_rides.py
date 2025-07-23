from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.auth import get_current_user
from app.db.crud.recurring_ride import (
    get_all_recurring_rides,
    create_recurring_ride,
    get_user_recurring_rides,
    get_recurring_ride,
    update_recurring_ride,
    delete_recurring_ride,
    get_recurring_rides_by_day
)
from app.schema.recurring_ride import (
    RecurringRideCreate,
    RecurringRideUpdate,
    RecurringRideResponse,
    DayOfWeekOption,
    ScheduleOption
)

router = APIRouter()


@router.get("/", response_model=List[RecurringRideResponse])
async def search_recurring_rides(
    limit: int = Query(50, le=100),
    day_of_week: Optional[int] = Query(None, description="Filter by day of week (0=Monday, 6=Sunday)"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active recurring rides, optionally filtered by day of week"""
    try:
        if day_of_week is not None:
            rides = get_recurring_rides_by_day(db, day_of_week)
        else:
            rides = get_all_recurring_rides(db, limit)
        return rides or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recurring rides: {str(e)}"
        )


@router.post("/", response_model=RecurringRideResponse)
async def create_new_recurring_ride(
    recurring_ride: RecurringRideCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new recurring ride"""
    return create_recurring_ride(db, recurring_ride, current_user.id)


@router.get("/my-recurring-rides", response_model=List[RecurringRideResponse])
async def get_my_recurring_rides(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's recurring rides"""
    return get_user_recurring_rides(db, current_user.id)


@router.get("/{recurring_ride_id}", response_model=RecurringRideResponse)
async def get_recurring_ride_details(
    recurring_ride_id: int,
    db: Session = Depends(get_db)
):
    """Get details of a specific recurring ride"""
    ride = get_recurring_ride(db, recurring_ride_id)
    if not ride:
        raise HTTPException(status_code=404, detail="Recurring ride not found")
    return ride


@router.put("/{recurring_ride_id}", response_model=RecurringRideResponse)
async def update_recurring_ride_details(
    recurring_ride_id: int,
    recurring_ride_update: RecurringRideUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a recurring ride (only by the driver)"""
    updated_ride = update_recurring_ride(db, recurring_ride_id, recurring_ride_update, current_user.id)
    if not updated_ride:
        raise HTTPException(status_code=404, detail="Recurring ride not found or unauthorized")
    return updated_ride


@router.delete("/{recurring_ride_id}")
async def delete_recurring_ride_endpoint(
    recurring_ride_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a recurring ride (only by the driver)"""
    success = delete_recurring_ride(db, recurring_ride_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Recurring ride not found or unauthorized")
    return {"message": "Recurring ride deleted successfully"}


@router.get("/options/days-of-week", response_model=List[DayOfWeekOption])
async def get_days_of_week_options():
    """Get available days of week options"""
    return [
        {"value": 0, "label": "Monday"},
        {"value": 1, "label": "Tuesday"},
        {"value": 2, "label": "Wednesday"},
        {"value": 3, "label": "Thursday"},
        {"value": 4, "label": "Friday"},
        {"value": 5, "label": "Saturday"},
        {"value": 6, "label": "Sunday"},
    ]


@router.get("/options/schedule-types", response_model=List[ScheduleOption])
async def get_schedule_type_options():
    """Get available schedule type options"""
    return [
        {"value": "weekly", "label": "Every week"},
        {"value": "daily", "label": "Every day"},
        {"value": "weekdays", "label": "Every weekday"},
        {"value": "weekends", "label": "Every weekend"},
    ]