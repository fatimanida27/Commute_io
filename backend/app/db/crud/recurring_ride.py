from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.models.recurring_ride import RecurringRide
from app.schema.recurring_ride import RecurringRideCreate, RecurringRideUpdate


def get_recurring_ride(db: Session, recurring_ride_id: int) -> Optional[RecurringRide]:
    return db.query(RecurringRide).filter(RecurringRide.id == recurring_ride_id).first()


def get_user_recurring_rides(db: Session, user_id: int) -> List[RecurringRide]:
    return db.query(RecurringRide).filter(RecurringRide.driver_id == user_id).all()


def get_all_recurring_rides(db: Session, limit: int = 50) -> List[RecurringRide]:
    return db.query(RecurringRide).filter(RecurringRide.status == "active").limit(limit).all()


def create_recurring_ride(db: Session, recurring_ride: RecurringRideCreate, driver_id: int) -> RecurringRide:
    db_recurring_ride = RecurringRide(**recurring_ride.dict(), driver_id=driver_id)
    db.add(db_recurring_ride)
    db.commit()
    db.refresh(db_recurring_ride)
    return db_recurring_ride


def update_recurring_ride(
    db: Session, 
    recurring_ride_id: int, 
    recurring_ride_update: RecurringRideUpdate, 
    driver_id: int
) -> Optional[RecurringRide]:
    db_recurring_ride = db.query(RecurringRide).filter(
        RecurringRide.id == recurring_ride_id,
        RecurringRide.driver_id == driver_id
    ).first()
    
    if not db_recurring_ride:
        return None
    
    update_data = recurring_ride_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_recurring_ride, key, value)
    
    db.commit()
    db.refresh(db_recurring_ride)
    return db_recurring_ride


def delete_recurring_ride(db: Session, recurring_ride_id: int, driver_id: int) -> bool:
    db_recurring_ride = db.query(RecurringRide).filter(
        RecurringRide.id == recurring_ride_id,
        RecurringRide.driver_id == driver_id
    ).first()
    
    if not db_recurring_ride:
        return False
    
    db.delete(db_recurring_ride)
    db.commit()
    return True


def get_recurring_rides_by_day(db: Session, day_of_week: int) -> List[RecurringRide]:
    """Get all active recurring rides for a specific day of the week"""
    return db.query(RecurringRide).filter(
        RecurringRide.day_of_week == day_of_week,
        RecurringRide.status == "active"
    ).all()