from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.models.ride_request import RideRequest
from app.db.models.ride import Ride


def create_ride_request(db: Session, ride_id: int, rider_id: int, message: str = None) -> RideRequest:
    db_request = RideRequest(ride_id=ride_id, rider_id=rider_id, message=message)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def get_ride_requests(db: Session, ride_id: int) -> List[RideRequest]:
    return db.query(RideRequest).filter(RideRequest.ride_id == ride_id, RideRequest.status == 'pending').all()

def get_ride_accepted_requests(db: Session, ride_id: int) -> List[RideRequest]:
    return db.query(RideRequest).filter(RideRequest.ride_id == ride_id, RideRequest.status == 'accepted').all()

def get_user_ride_requests(db: Session, user_id: int) -> List[RideRequest]:
    current_time = datetime.now()
    print(f"Current Time: {current_time}")
    six_hours_before = current_time - timedelta(hours=6)
    six_hours_after = current_time + timedelta(hours=6)
    
    return db.query(RideRequest)\
        .join(Ride, RideRequest.ride_id == Ride.id)\
        .filter(
            RideRequest.rider_id == user_id,
            Ride.start_time >= six_hours_before,
            Ride.start_time <= six_hours_after,
            Ride.status == 'active'
        )\
        .all()

def get_driver_ride_requests(db: Session, driver_id: int) -> List[RideRequest]:
    """Get all ride requests for rides owned by the driver"""
    return (db.query(RideRequest)
            .join(Ride, RideRequest.ride_id == Ride.id)
            .options(
                joinedload(RideRequest.rider),
                joinedload(RideRequest.ride).joinedload(Ride.driver),
                joinedload(RideRequest.ride).joinedload(Ride.car)
            )
            .filter(Ride.driver_id == driver_id,Ride.status == 'active')
            .order_by(RideRequest.requested_at.desc())
            .all())

def update_ride_request_status(db: Session, request_id: int, status: str) -> Optional[RideRequest]:
    db_request = db.query(RideRequest).filter(RideRequest.id == request_id).first()
    if not db_request:
        return None
    db_request.status = status
    db.commit()
    db.refresh(db_request)
    return db_request

def user_already_requested(db: Session, ride_id: int, user_id: int) -> bool:
    return db.query(RideRequest).filter(
        RideRequest.ride_id == ride_id,
        RideRequest.rider_id == user_id
    ).first() is not None

def get_existing_request_time(db: Session, ride_id: int, user_id: int) -> str:
    """
    Returns the ISO formatted datetime string of when the user previously requested this ride
    """
    existing_request = db.query(RideRequest).filter(
        RideRequest.ride_id == ride_id,
        RideRequest.rider_id == user_id
    ).first()

    if existing_request:
        return existing_request.requested_at.isoformat()
    return None