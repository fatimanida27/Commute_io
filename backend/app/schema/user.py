from pydantic import BaseModel, EmailStr, computed_field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum


class GenderPreference(str, Enum):
    NO_PREFERENCE = "No preference"
    MALE_ONLY = "Male only"
    FEMALE_ONLY = "Female only"

class AuthMethod(str, Enum):
    EMAIL = "email"
    PHONE = "phone"

class MusicPreference(str, Enum):
    NO_MUSIC = "No music"
    LIGHT_MUSIC = "Light music"
    LOUD_MUSIC = "Loud music"
    USER_CAN_CHOOSE = "User can choose"


class ConversationPreference(str, Enum):
    SILENT_RIDE = "Silent ride"
    TALKATIVE_RIDE = "Talkative ride"
    NO_PREFERENCE = "No preference"


class SmokingPreference(str, Enum):
    REQUIRED = "Required"
    PREFERRED = "Preferred"
    NOT_REQUIRED = "Not required"


class UserPreferences(BaseModel):
    gender_preference: Optional[GenderPreference] = GenderPreference.NO_PREFERENCE
    music_preference: Optional[MusicPreference] = MusicPreference.USER_CAN_CHOOSE
    conversation_preference: Optional[ConversationPreference] = ConversationPreference.NO_PREFERENCE
    smoking_preference: Optional[SmokingPreference] = SmokingPreference.NOT_REQUIRED


class UserBase(BaseModel):
    name: str = ""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    gender: Optional[str] = None
    is_driver: bool = False
    is_rider: bool = False
    preferences: Optional[UserPreferences] = None

class UserCreateEmail(UserBase):
    email: EmailStr  # Required for email flow

class UserCreatePhone(UserBase):
    phone: str  # Required for phone flow

class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    bio: Optional[str] = None
    is_driver: Optional[bool] = None
    is_rider: Optional[bool] = None
    preferences: Optional[UserPreferences] = None
    photo_url: Optional[str] = None


class UserResponse(UserBase):
    id: int
    photo_url: Optional[str] = None
    trust_score: float
    created_at: datetime
    @computed_field
    def auth_methods(self) -> list[AuthMethod]:
        methods = []
        if getattr(self, "email", None):  # Check if email exists and is not None
            methods.append(AuthMethod.EMAIL)
        if getattr(self, "phone", None):  # Check if phone exists and is not None
            methods.append(AuthMethod.PHONE)
        return methods
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProfileResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str]
    gender: Optional[str] = None
    is_driver: bool
    is_rider: bool
    photo_url: Optional[str] = None
    rides_taken: int
    rides_offered: int
    preferences: Optional[UserPreferences] = None
    driver_rating: float
    rider_rating: float
    
    class Config:
        extra = "ignore"

class PublicUserProfile(BaseModel):
    id: int
    name: str
    bio: Optional[str]
    photo_url: Optional[str]
    rides_taken: int
    rides_offered: int

class UserRegister(UserBase):
    password: str

class UserMobileRegister(BaseModel):
    phone: str  # Required for mobile registration
    name: str = ""  # Default empty string
    email: Optional[str] = None  # Truly optional
    bio: Optional[str] = None
    gender: Optional[str] = None
    is_driver: bool = False
    is_rider: bool = False
    preferences: Optional[str] = None
    password: str = ""  # Default empty (or use dummy value)

class Token(BaseModel):
    access_token: str
    token_type: str
    is_new_user: bool 
    auth_method: AuthMethod
    user: UserResponse


class TokenData(BaseModel):
    identifier: str  # Can be email or phone
    auth_method: AuthMethod

class OTPRequest(BaseModel):
    email: EmailStr

class OTPMobileRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class OTPMobileVerify(BaseModel):
    phone: str
    otp: str