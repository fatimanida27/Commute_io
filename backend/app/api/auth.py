from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from app.services.email_service import send_otp_email  # Import the service
from app.services.mobile_service import send_otp_mobile  # Import the mobile service
from app.core.database import get_db
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    verify_token,
    generate_otp,
    store_otp,
    verify_otp,
    store_mobile_otp,
    verify_mobile_otp
)
from app.db.crud.user import get_user_by_email, create_user, get_user, get_user_by_phone
from app.schema.user import AuthMethod, UserRegister, UserLogin, UserCreateEmail, UserCreatePhone, Token, OTPRequest, OTPMobileRequest, OTPVerify, OTPMobileVerify, UserResponse, UserMobileRegister
from app.core.config import settings

router = APIRouter()
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token_data = verify_token(credentials.credentials)
    if isinstance(token_data, str):
        # Old format - just email as string
        user = get_user_by_email(db, email=token_data)
    else:
        # New format - payload dictionary
        identifier = token_data.get("sub")
        auth_method = token_data.get("auth_method")
        
        if auth_method == AuthMethod.EMAIL:
            user = get_user_by_email(db, email=identifier)
        elif auth_method == AuthMethod.PHONE:
            user = get_user_by_phone(db, phone=identifier)
        else:
            # Fallback for backward compatibility
            user = get_user_by_email(db, email=identifier) or \
                   get_user_by_phone(db, phone=identifier)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    if get_user_by_email(db, email=user_data.email):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create user
    user = create_user(db, user_data)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=login_data.email)
    
    if not user:
        # User doesn't exist, create new user with email only
        user = User(
            email=login_data.email,
            email_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        needs_setup = True
    else:
        # User exists, check if profile is complete
        needs_setup = not user.name or not (user.is_driver or user.is_rider)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "needs_profile_setup": needs_setup
    }


@router.post("/send-otp")
async def send_otp(request: OTPRequest, db: Session = Depends(get_db)):
    #user = get_user_by_email(db, email=request.email)
    # if not user:
    #     raise HTTPException(status_code=404, detail="User not found")
    print(f"Attempting to send OTP to: {request.email}")  # Debug log
    try:
        otp = generate_otp()
        store_otp(request.email, otp)
        
        # Wrap email sending in try-except
        try:
            send_otp_email(request.email, otp)
        except Exception as e:
            print(f"Email sending failed: {str(e)}")
            # Don't raise HTTPException here - return a success response but log the error
            # (In production, you might want to use a fallback SMS service here)
        
        return {"message": "OTP processed successfully"}  # Always return success
    
    except Exception as e:
        print(f"OTP generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")



@router.post("/verify-otp", response_model=Token)
async def verify_otp_endpoint(request: OTPVerify, db: Session = Depends(get_db)):
    if not verify_otp(request.email, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    user = get_user_by_email(db, email=request.email)
    is_new_user = False

    if not user:
        user_data = UserCreateEmail(
            email=request.email,
        )
        user = create_user(db, user_data)
        is_new_user = True
    
    access_token = create_access_token(
        data={"sub": user.email, "auth_method": AuthMethod.EMAIL},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    print(f"{is_new_user}")

    return Token(
        access_token=access_token,
        auth_method=AuthMethod.EMAIL,
        token_type="bearer",  # Add this required field
        is_new_user=is_new_user,
        user=UserResponse.from_orm(user)
    )

@router.post("/send-mobile-otp")
async def send_mobile_otp(request: OTPMobileRequest, db: Session = Depends(get_db)):
    #user = get_user_by_email(db, email=request.email)
    # if not user:
    #     raise HTTPException(status_code=404, detail="User not found")
    print(f"Attempting to send OTP to: {request.phone}")  # Debug log
    try:
        otp = generate_otp()
        store_mobile_otp(request.phone, otp)
        
        # Wrap email sending in try-except
        try:
            send_otp_mobile(request.phone, otp)
        except Exception as e:
            print(f"Mobile sending failed: {str(e)}")
            # Don't raise HTTPException here - return a success response but log the error
            # (In production, you might want to use a fallback SMS service here)
        
        return {"message": "OTP processed successfully"}  # Always return success
    
    except Exception as e:
        print(f"OTP generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")



@router.post("/verify-mobile-otp", response_model=Token)
async def verify__mobile_otp_endpoint(request: OTPMobileVerify, db: Session = Depends(get_db)):
    if not verify_mobile_otp(request.phone, request.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    user = get_user_by_phone(db, request.phone)
    is_new_user = False

    if not user:
        user_data = UserCreatePhone(
            phone=request.phone,
        )
        user = create_user(db, user_data)
        is_new_user = True
    
    access_token = create_access_token(
        data={"sub": user.phone, "auth_method": AuthMethod.PHONE},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    print(f"{is_new_user}")

    return Token(
        access_token=access_token,
        auth_method=AuthMethod.PHONE,
        token_type="bearer",  # Add this required field
        is_new_user=is_new_user,
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    return current_user