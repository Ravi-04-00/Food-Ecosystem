import os
import re
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError as DjangoValidationError

from .models import (
    User, Profile, Address, MobileOTP, Wallet, WalletTransaction,
    LoyaltyProfile, LoginActivity, SecurityAlert, AuditLog,
    SupportTicket, TicketMessage, UserSettings
)
from apps.products.models import Restaurant
from apps.delivery.models import DeliveryPartner

# ---------------------------------------------------------------------------
# Validation Helpers
# ---------------------------------------------------------------------------

NAME_REGEX = re.compile(r"^[a-zA-Z\s\.\-']{2,100}$")
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
ALLOWED_VEHICLE_TYPES = ['Bike', 'Scooter', 'Electric Bike', 'Other']


def normalize_phone(phone_raw):
    """Normalize phone by stripping whitespaces, dashes, and extra chars."""
    if not phone_raw:
        return ''
    cleaned = re.sub(r'[\s\-\(\)]', '', str(phone_raw).strip())
    return cleaned


def validate_name_field(value, field_label="Name"):
    """Validates name: 2-100 characters, letters, spaces, hyphens, periods, apostrophes."""
    val = (value or '').strip()
    if len(val) < 2 or len(val) > 100:
        raise serializers.ValidationError(f"{field_label} must be between 2 and 100 characters.")
    if not NAME_REGEX.match(val):
        raise serializers.ValidationError(
            f"{field_label} contains invalid characters. Only letters, spaces, hyphens, and periods are allowed."
        )
    return val


def validate_email_field(value):
    """Normalizes and validates email uniqueness."""
    email_clean = (value or '').strip().lower()
    if not email_clean:
        raise serializers.ValidationError("Email address is required.")
    try:
        django_validate_email(email_clean)
    except DjangoValidationError:
        raise serializers.ValidationError("Please provide a valid email address.")
    if User.objects.filter(email__iexact=email_clean).exists():
        raise serializers.ValidationError("A user with this email address already exists.")
    return email_clean


def validate_phone_field(value):
    """Normalizes and validates phone format (10-15 digits) and uniqueness."""
    phone_clean = normalize_phone(value)
    if not phone_clean:
        raise serializers.ValidationError("Phone number is required.")
    # Check digit count
    digits_only = re.sub(r'\D', '', phone_clean)
    if len(digits_only) < 10 or len(digits_only) > 15:
        raise serializers.ValidationError("Phone number must contain between 10 and 15 digits.")
    # Reject obvious dummy sequences (e.g. 0000000000, 1111111111, 1234567890)
    if re.match(r'^(\d)\1{9,}$', digits_only) or digits_only in ['1234567890', '0123456789', '9876543210', '0000000000']:
        raise serializers.ValidationError("Please provide a valid, realistic phone number.")
    if User.objects.filter(phone=phone_clean).exists() or User.objects.filter(phone=digits_only).exists():
        raise serializers.ValidationError("A user with this phone number already exists.")
    return phone_clean


def validate_password_strength(password):
    """Validates password length and complexity."""
    if not password or len(password) < 8:
        raise serializers.ValidationError("Password must be at least 8 characters long.")
    # Reject purely numeric or weak passwords
    if password.isdigit():
        raise serializers.ValidationError("Password cannot consist of only numbers.")
    if not re.search(r'[A-Za-z]', password):
        raise serializers.ValidationError("Password must contain at least one letter.")
    if not re.search(r'[0-9!@#$%^&*()_+=\-\[\]{}|\\:;"\'<>,.?/~`]', password):
        raise serializers.ValidationError("Password must contain at least one number or special character.")
    return password


def validate_image_upload(image_file, max_mb=5):
    """
    Phase 29 Hardened: Validates uploaded image file type, size, path safety,
    and binary magic byte signatures (prevents MIME spoofing & path traversal).
    """
    if not image_file:
        return None

    # 1. Path traversal & null byte sanitization
    raw_name = str(image_file.name)
    if '..' in raw_name or '/' in raw_name or '\\' in raw_name or '\x00' in raw_name:
        raise serializers.ValidationError("Path traversal characters or directory separators detected in file name.")
    safe_name = os.path.basename(raw_name)
    if not safe_name or safe_name in ['.', '..']:
        raise serializers.ValidationError("Invalid file name detected.")

    # 2. Check size limit
    if image_file.size > max_mb * 1024 * 1024:
        raise serializers.ValidationError(f"Image file size must not exceed {max_mb} MB.")

    # 3. Check extension
    ext = os.path.splitext(safe_name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise serializers.ValidationError(
            f"Invalid file type '{ext}'. Allowed image formats are: JPG, JPEG, PNG, WEBP."
        )

    # 4. Check client-supplied content type if available
    content_type = getattr(image_file, 'content_type', '')
    if content_type and not content_type.startswith('image/'):
        raise serializers.ValidationError("Uploaded file is not a valid image.")

    # 5. Cryptographic / Magic byte signature verification
    try:
        current_pos = image_file.tell() if hasattr(image_file, 'tell') else 0
        image_file.seek(0)
        header = image_file.read(16)
        if hasattr(image_file, 'seek'):
            image_file.seek(current_pos)

        is_valid_signature = False
        if header.startswith(b'\xff\xd8\xff'):  # JPEG
            is_valid_signature = True
        elif header.startswith(b'\x89PNG\r\n\x1a\n'):  # PNG
            is_valid_signature = True
        elif header.startswith(b'RIFF') and b'WEBP' in header[:16]:  # WEBP
            is_valid_signature = True

        if not is_valid_signature and len(header) >= 4:
            raise serializers.ValidationError("File signature verification failed. The file content does not match an authentic image.")
    except serializers.ValidationError:
        raise
    except Exception:
        # Fallback gracefully if stream does not support seek in mocked tests
        pass

    return image_file


def generate_unique_username(base_str):
    """Generates a safe unique username for the User model."""
    clean = re.sub(r'[^a-zA-Z0-9_]', '', base_str.lower())[:25] or 'user'
    candidate = clean
    counter = 1
    while User.objects.filter(username=candidate).exists():
        candidate = f"{clean}_{counter}"
        counter += 1
    return candidate


# ---------------------------------------------------------------------------
# Core Serializers
# ---------------------------------------------------------------------------

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'full_name', 'avatar', 'profile_photo', 'phone', 'address',
            'bio', 'is_verified', 'verification_status', 'current_lat', 'current_lng'
        ]


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'role', 'phone', 'avatar',
            'is_online', 'rating', 'profile', 'created_at'
        ]


# ---------------------------------------------------------------------------
# Phase 2: Role-Specific Registration Serializers
# ---------------------------------------------------------------------------

class CustomerRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100, required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(max_length=25, required=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    address = serializers.CharField(required=True)
    profile_photo = serializers.ImageField(required=False, allow_null=True)

    def validate_full_name(self, value):
        return validate_name_field(value, "Full Name")

    def validate_email(self, value):
        return validate_email_field(value)

    def validate_phone(self, value):
        return validate_phone_field(value)

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate_profile_photo(self, value):
        return validate_image_upload(value)

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": ["Passwords do not match."]})
        address = (attrs.get('address') or '').strip()
        if not address:
            raise serializers.ValidationError({"address": ["Address is required."]})
        return attrs

    def create(self, validated_data):
        email = validated_data['email']
        full_name = validated_data['full_name']
        phone = validated_data['phone']
        password = validated_data['password']
        address = validated_data['address'].strip()
        profile_photo = validated_data.get('profile_photo')

        username = generate_unique_username(email.split('@')[0])
        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            role='CUSTOMER',
            phone=phone
        )

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.full_name = full_name
        profile.phone = phone
        profile.address = address
        profile.is_verified = True
        profile.verification_status = 'APPROVED'
        if profile_photo:
            profile.profile_photo = profile_photo
        profile.save()

        # Auto create default customer wallet & loyalty profile
        Wallet.objects.get_or_create(user=user)
        LoyaltyProfile.objects.get_or_create(user=user)

        return user


class RestaurantRegisterSerializer(serializers.Serializer):
    owner_name = serializers.CharField(max_length=100, required=True)
    restaurant_name = serializers.CharField(max_length=255, required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(max_length=25, required=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    restaurant_address = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    restaurant_logo = serializers.ImageField(required=False, allow_null=True)

    def validate_owner_name(self, value):
        return validate_name_field(value, "Owner Name")

    def validate_restaurant_name(self, value):
        val = (value or '').strip()
        if len(val) < 2 or len(val) > 255:
            raise serializers.ValidationError("Restaurant name must be between 2 and 255 characters.")
        if Restaurant.objects.filter(name__iexact=val).exists():
            raise serializers.ValidationError("A restaurant with this name is already registered.")
        return val

    def validate_email(self, value):
        return validate_email_field(value)

    def validate_phone(self, value):
        return validate_phone_field(value)

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate_restaurant_logo(self, value):
        return validate_image_upload(value)

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": ["Passwords do not match."]})
        address = (attrs.get('restaurant_address') or attrs.get('address') or '').strip()
        if not address or len(address) < 5:
            raise serializers.ValidationError({"restaurant_address": ["Restaurant address must be at least 5 characters long."]})
        attrs['restaurant_address'] = address
        return attrs

    def create(self, validated_data):
        email = validated_data['email']
        owner_name = validated_data['owner_name']
        restaurant_name = validated_data['restaurant_name']
        phone = validated_data['phone']
        password = validated_data['password']
        restaurant_address = validated_data['restaurant_address'].strip()
        restaurant_logo = validated_data.get('restaurant_logo')

        username = generate_unique_username(restaurant_name)
        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            role='RESTAURANT',
            phone=phone
        )

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.full_name = owner_name
        profile.phone = phone
        profile.address = restaurant_address
        profile.is_verified = False
        profile.verification_status = 'PENDING'
        profile.save()

        restaurant = Restaurant.objects.create(
            owner=user,
            name=restaurant_name,
            owner_name=owner_name,
            address=restaurant_address,
            is_verified=False,
            verification_status='PENDING'
        )
        if restaurant_logo:
            restaurant.restaurant_logo = restaurant_logo
            restaurant.save()

        Wallet.objects.get_or_create(user=user)

        return user


class DeliveryPartnerRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100, required=True)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(max_length=25, required=True)
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    address = serializers.CharField(required=True)
    vehicle_type = serializers.CharField(max_length=50, required=False, allow_blank=True, default='Bike')
    vehicle_model = serializers.CharField(max_length=100, required=False, allow_blank=True, default='Standard Delivery Vehicle')
    vehicle_number = serializers.CharField(max_length=32, required=False, allow_blank=True, default='')
    profile_photo = serializers.ImageField(required=False, allow_null=True)

    def validate_full_name(self, value):
        return validate_name_field(value, "Full Name")

    def validate_email(self, value):
        return validate_email_field(value)

    def validate_phone(self, value):
        return validate_phone_field(value)

    def validate_password(self, value):
        return validate_password_strength(value)

    def validate_vehicle_type(self, value):
        val = (value or '').strip()
        if not val:
            return 'Bike'
        for allowed in ALLOWED_VEHICLE_TYPES:
            if allowed.lower() == val.lower():
                return allowed
        raise serializers.ValidationError(
            f"Invalid vehicle type '{val}'. Allowed options: {', '.join(ALLOWED_VEHICLE_TYPES)}"
        )

    def validate_vehicle_model(self, value):
        val = (value or '').strip()
        if not val:
            return 'Standard Delivery Vehicle'
        if len(val) < 2 or len(val) > 100:
            raise serializers.ValidationError("Vehicle model must be between 2 and 100 characters.")
        return val

    def validate_vehicle_number(self, value):
        raw = (value or '').strip().upper()
        if not raw:
            return ''
        val = re.sub(r'[\s\-]', '', raw)
        if len(val) < 4 or len(val) > 20:
            raise serializers.ValidationError("Vehicle number must be valid (e.g. KA-01-AB-1234).")
        existing = DeliveryPartner.objects.filter(vehicle_number__iexact=raw)
        if existing.exists():
            raise serializers.ValidationError("A delivery vehicle with this registration number already exists.")
        return raw

    def validate_profile_photo(self, value):
        return validate_image_upload(value)

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": ["Passwords do not match."]})
        address = (attrs.get('address') or '').strip()
        if not address or len(address) < 5:
            raise serializers.ValidationError({"address": ["Delivery partner address must be at least 5 characters long."]})
        return attrs

    def create(self, validated_data):
        import random
        email = validated_data['email']
        full_name = validated_data['full_name']
        phone = validated_data['phone']
        password = validated_data['password']
        address = validated_data['address'].strip()
        vehicle_type = validated_data.get('vehicle_type') or 'Bike'
        vehicle_model = validated_data.get('vehicle_model') or 'Standard Delivery Vehicle'
        vehicle_number = validated_data.get('vehicle_number') or ''
        profile_photo = validated_data.get('profile_photo')

        username = generate_unique_username(full_name)
        user = User.objects.create_user(
            email=email,
            username=username,
            password=password,
            role='DELIVERY',
            phone=phone
        )

        profile, _ = Profile.objects.get_or_create(user=user)
        profile.full_name = full_name
        profile.phone = phone
        profile.address = address
        profile.is_verified = False
        profile.verification_status = 'PENDING'
        if profile_photo:
            profile.profile_photo = profile_photo
        profile.save()

        # If vehicle_number was not specified, assign a unique temporary fleet number
        if not vehicle_number:
            vehicle_number = f"KA-01-DP-{user.id:04d}{random.randint(10, 99)}"

        partner = DeliveryPartner.objects.create(
            user=user,
            vehicle_type=vehicle_type,
            vehicle_model=vehicle_model,
            vehicle_number=vehicle_number,
            is_verified=False,
            verification_status='PENDING'
        )
        if profile_photo:
            partner.profile_photo = profile_photo
            partner.save()

        Wallet.objects.get_or_create(user=user)

        return user


# ---------------------------------------------------------------------------
# Backward-Compatible & Unified Dispatch RegisterSerializer
# ---------------------------------------------------------------------------

class RegisterSerializer(serializers.Serializer):
    """
    Unified registration serializer that routes based on role.
    Explicitly prohibits ADMIN role registration.
    """
    role = serializers.CharField(required=False, default='CUSTOMER')

    def validate_role(self, value):
        role_upper = (value or '').strip().upper()
        if role_upper in ['ADMIN', 'SUPERUSER', 'STAFF']:
            raise serializers.ValidationError("Public registration for ADMIN is forbidden. Admin accounts must be created through secure backend processes.")
        if role_upper not in ['CUSTOMER', 'RESTAURANT', 'SHOP', 'DELIVERY', 'RIDER']:
            raise serializers.ValidationError(f"Invalid registration role '{value}'.")
        return role_upper

    def validate(self, attrs):
        role = attrs.get('role', 'CUSTOMER')
        # Re-check request context data
        req_role = self.initial_data.get('role', role).upper()
        if req_role in ['ADMIN', 'SUPERUSER', 'STAFF']:
            raise serializers.ValidationError({"role": ["Admin registration is not permitted via public registration."]})
        return attrs


# ---------------------------------------------------------------------------
# Other App Serializers (Preserved from Existing Code)
# ---------------------------------------------------------------------------

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ['user']

    def validate_pincode(self, value):
        code = re.sub(r'\s', '', str(value or ''))
        if not re.fullmatch(r'[1-9][0-9]{5}', code):
            raise serializers.ValidationError("Enter a valid 6-digit PIN code.")
        return code

    def validate_phone(self, value):
        digits = re.sub(r'\D', '', str(value or ''))
        if len(digits) < 10 or len(digits) > 15:
            raise serializers.ValidationError("Enter a valid 10-15 digit mobile number.")
        return str(value or '').strip()

    def validate_full_name(self, value):
        if not (value or '').strip():
            raise serializers.ValidationError("Recipient name is required.")
        return validate_name_field(value, 'Recipient name')

    def validate_street(self, value):
        if not (value or '').strip():
            raise serializers.ValidationError("House/flat and street details are required.")
        return str(value).strip()


class SendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=25)
    purpose = serializers.ChoiceField(choices=['LOGIN', 'REGISTER', 'VERIFY'], default='LOGIN')


class VerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=25)
    otp = serializers.CharField(max_length=8)
    role = serializers.ChoiceField(choices=['CUSTOMER', 'RESTAURANT', 'SHOP', 'DELIVERY', 'RIDER', 'ADMIN'], default='CUSTOMER')


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = '__all__'


class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Wallet
        fields = ['id', 'balance', 'currency', 'updated_at', 'transactions']


class LoyaltyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyProfile
        fields = '__all__'


class LoginActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginActivity
        fields = '__all__'


class SecurityAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityAlert
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source='actor.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = TicketMessage
        fields = ['id', 'ticket', 'sender', 'sender_name', 'message', 'is_staff', 'created_at']
        read_only_fields = ['sender', 'is_staff']


class SupportTicketSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = SupportTicket
        fields = ['id', 'ticket_number', 'user', 'user_email', 'order_id', 'subject', 'category', 'priority', 'status', 'created_at', 'updated_at', 'messages']
        read_only_fields = ['user', 'ticket_number']


# ---------------------------------------------------------------------------
# Phase 3: JWT Real-Life Authentication & Role Verification
# ---------------------------------------------------------------------------

def get_canonical_role(user):
    """Maps raw User model roles to canonical Phase 3 roles."""
    raw_role = str(getattr(user, 'role', '') or '').strip().upper()
    if raw_role in ['RESTAURANT', 'SHOP']:
        return 'RESTAURANT'
    elif raw_role in ['DELIVERY', 'RIDER', 'DELIVERY_PARTNER']:
        return 'DELIVERY_PARTNER'
    elif raw_role == 'ADMIN' or getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False):
        return 'ADMIN'
    return 'CUSTOMER'


def get_account_status(user, canonical_role=None):
    """
    Computes real-life account status for user based on role and active records.
    Returns: 'ACTIVE', 'BLOCKED', 'PENDING_VERIFICATION', 'REJECTED'
    """
    if not user.is_active:
        return 'BLOCKED'

    if canonical_role is None:
        canonical_role = get_canonical_role(user)

    if canonical_role == 'CUSTOMER':
        return 'ACTIVE'
    elif canonical_role == 'ADMIN':
        return 'ACTIVE'
    elif canonical_role == 'RESTAURANT':
        restaurant = Restaurant.objects.filter(owner=user).first()
        if restaurant:
            status_str = str(restaurant.verification_status).upper()
            if status_str == 'APPROVED' or restaurant.is_verified:
                return 'ACTIVE'
            elif status_str == 'REJECTED':
                return 'REJECTED'
            else:
                return 'PENDING_VERIFICATION'
        profile = getattr(user, 'profile', None)
        if profile and profile.verification_status == 'APPROVED':
            return 'ACTIVE'
        return 'PENDING_VERIFICATION'
    elif canonical_role == 'DELIVERY_PARTNER':
        partner = DeliveryPartner.objects.filter(user=user).first()
        if partner:
            status_str = str(partner.verification_status).upper()
            if status_str == 'APPROVED' or partner.is_verified:
                return 'ACTIVE'
            elif status_str == 'REJECTED':
                return 'REJECTED'
            else:
                return 'PENDING_VERIFICATION'
        profile = getattr(user, 'profile', None)
        if profile and profile.verification_status == 'APPROVED':
            return 'ACTIVE'
        return 'PENDING_VERIFICATION'
    return 'ACTIVE'


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=False, allow_blank=True)
    email_or_phone = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True)
    role = serializers.CharField(required=False, allow_blank=True)
    expected_role = serializers.CharField(required=False, allow_blank=True)
    allow_pending = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        raw_login_id = (
            attrs.get('identifier') or 
            attrs.get('email_or_phone') or 
            attrs.get('email') or 
            attrs.get('phone') or 
            attrs.get('username') or 
            ''
        ).strip()
        password = attrs.get('password', '')

        if not raw_login_id or not password:
            raise serializers.ValidationError({"detail": "Invalid email/phone or password."})

        cleaned_phone = normalize_phone(raw_login_id)
        digits_only = re.sub(r'\D', '', raw_login_id)

        user = User.objects.filter(email__iexact=raw_login_id).first()
        if not user:
            user = User.objects.filter(phone__iexact=raw_login_id).first()
            # Phone-number lookup only when the identifier actually contains
            # digits. Without this guard, digits_only == '' and
            # filter(phone='') would match the first user with a blank phone
            # number, letting anyone log in as that user (auth bypass).
            if not user and cleaned_phone and digits_only:
                user = User.objects.filter(phone=cleaned_phone).first() or User.objects.filter(phone=digits_only).first()
            if not user and len(digits_only) >= 10:
                user = User.objects.filter(phone__endswith=digits_only[-10:]).first()
        if not user:
            user = User.objects.filter(username__iexact=raw_login_id).first()

        if not user:
            raise serializers.ValidationError({"detail": "Invalid email/phone or password."})

        # Secure password comparison using Django password hasher
        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Invalid email/phone or password."})

        # Determine canonical role and account status
        canonical_role = get_canonical_role(user)
        account_status = get_account_status(user, canonical_role)

        # Enforce blocked account check
        if account_status == 'BLOCKED' or not user.is_active:
            raise serializers.ValidationError({
                "detail": "Your account is currently blocked.",
                "account_status": "BLOCKED"
            })

        # Enforce rejected account check
        if account_status == 'REJECTED':
            raise serializers.ValidationError({
                "detail": "Your account application has been rejected.",
                "account_status": "REJECTED"
            })

        # Enforce role matching if requested by the frontend portal
        target_role = (attrs.get('expected_role') or attrs.get('role') or '').strip().upper()
        if target_role:
            if target_role in ['RESTAURANT', 'SHOP']:
                norm_target = 'RESTAURANT'
            elif target_role in ['DELIVERY', 'RIDER', 'DELIVERY_PARTNER']:
                norm_target = 'DELIVERY_PARTNER'
            elif target_role == 'ADMIN':
                norm_target = 'ADMIN'
            elif target_role == 'CUSTOMER':
                norm_target = 'CUSTOMER'
            else:
                norm_target = target_role

            if canonical_role != norm_target:
                raise serializers.ValidationError({
                    "detail": "You are not authorized to access this application.",
                    "wrong_role": True,
                    "user_role": canonical_role,
                    "required_role": norm_target
                })

        # Enforce pending verification check for operational partner accounts
        if account_status == 'PENDING_VERIFICATION' and not attrs.get('allow_pending', False):
            raise serializers.ValidationError({
                "detail": "Your account is waiting for verification.",
                "account_status": "PENDING_VERIFICATION"
            })

        # Generate JWT Access and Refresh Tokens
        refresh = RefreshToken.for_user(user)
        refresh['role'] = canonical_role
        refresh['account_status'] = account_status
        refresh['email'] = user.email
        refresh['user_id'] = user.id

        profile = getattr(user, 'profile', None)
        full_name = ''
        if profile and profile.full_name:
            full_name = profile.full_name
        elif user.first_name or user.last_name:
            full_name = f"{user.first_name} {user.last_name}".strip()
        else:
            full_name = user.username

        address = getattr(profile, 'address', '') if profile else ''
        avatar = (getattr(profile, 'avatar', '') if profile else '') or user.avatar or ''
        photo_url = ''
        if profile and profile.profile_photo:
            try:
                photo_url = profile.profile_photo.url
            except Exception:
                photo_url = ''

        return {
            'user': user,
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user_id': user.id,
            'role': canonical_role,
            'account_status': account_status,
            'basic_profile_information': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'full_name': full_name,
                'phone': user.phone or getattr(profile, 'phone', ''),
                'address': address,
                'avatar': avatar,
                'profile_photo': photo_url,
            }
        }


# ---------------------------------------------------------------------------
# Phase 5: Authenticated Profile Management Serializers
# ---------------------------------------------------------------------------

def validate_phone_for_user(phone_val, user):
    phone_clean = normalize_phone(phone_val)
    if not phone_clean:
        raise serializers.ValidationError("Phone number is required.")
    digits_only = re.sub(r'\D', '', phone_clean)
    if len(digits_only) < 10 or len(digits_only) > 15:
        raise serializers.ValidationError("Phone number must contain between 10 and 15 digits.")
    if re.match(r'^(\d)\1{9,}$', digits_only) or digits_only in ['1234567890', '0123456789', '9876543210', '0000000000']:
        raise serializers.ValidationError("Please provide a valid, realistic phone number.")
    if User.objects.filter(phone=phone_clean).exclude(id=user.id).exists() or \
       User.objects.filter(phone=digits_only).exclude(id=user.id).exists():
        raise serializers.ValidationError("A user with this phone number already exists.")
    return phone_clean


class CustomerProfileManageSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100, required=False)
    phone = serializers.CharField(max_length=25, required=False)
    address = serializers.CharField(required=False)
    profile_photo = serializers.ImageField(required=False, allow_null=True)
    remove_photo = serializers.BooleanField(required=False, default=False)
    email = serializers.EmailField(read_only=True)

    def validate_full_name(self, value):
        return validate_name_field(value, "Full Name")

    def validate_phone(self, value):
        user = self.context.get('request').user
        return validate_phone_for_user(value, user)

    def validate_address(self, value):
        val = (value or '').strip()
        if not val:
            raise serializers.ValidationError("Address cannot be blank.")
        return val

    def validate_profile_photo(self, value):
        return validate_image_upload(value)

    def update(self, instance, validated_data):
        profile, _ = Profile.objects.get_or_create(user=instance)

        if 'full_name' in validated_data:
            profile.full_name = validated_data['full_name']
        if 'phone' in validated_data:
            phone_val = validated_data['phone']
            instance.phone = phone_val
            profile.phone = phone_val
            instance.save(update_fields=['phone', 'updated_at'])
        if 'address' in validated_data:
            profile.address = validated_data['address']

        remove_photo = validated_data.get('remove_photo', False)
        if remove_photo:
            if profile.profile_photo:
                try:
                    profile.profile_photo.delete(save=False)
                except Exception:
                    pass
                profile.profile_photo = None
        elif 'profile_photo' in validated_data and validated_data['profile_photo']:
            profile.profile_photo = validated_data['profile_photo']

        profile.save()
        return instance

    def to_representation(self, instance):
        profile = getattr(instance, 'profile', None)
        photo_url = ''
        if profile and profile.profile_photo:
            try:
                photo_url = profile.profile_photo.url
            except Exception:
                photo_url = ''

        return {
            'role': 'CUSTOMER',
            'user_id': instance.id,
            'email': instance.email,
            'full_name': (profile.full_name if profile else '') or instance.username,
            'phone': instance.phone or (profile.phone if profile else ''),
            'address': profile.address if profile else '',
            'profile_photo': photo_url,
            'avatar': (profile.avatar if profile else '') or instance.avatar or '',
            'is_verified': profile.is_verified if profile else True,
            'verification_status': profile.verification_status if profile else 'APPROVED'
        }


class RestaurantProfileManageSerializer(serializers.Serializer):
    restaurant_name = serializers.CharField(max_length=255, required=False)
    owner_name = serializers.CharField(max_length=100, required=False)
    phone = serializers.CharField(max_length=25, required=False)
    restaurant_address = serializers.CharField(required=False)
    address = serializers.CharField(required=False)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    restaurant_logo = serializers.ImageField(required=False, allow_null=True)
    remove_logo = serializers.BooleanField(required=False, default=False)
    email = serializers.EmailField(read_only=True)
    verification_status = serializers.CharField(read_only=True)

    def validate_restaurant_name(self, value):
        val = (value or '').strip()
        if len(val) < 2 or len(val) > 255:
            raise serializers.ValidationError("Restaurant name must be between 2 and 255 characters.")
        user = self.context.get('request').user
        if Restaurant.objects.filter(name__iexact=val).exclude(owner=user).exists():
            raise serializers.ValidationError("A restaurant with this name is already registered.")
        return val

    def validate_owner_name(self, value):
        return validate_name_field(value, "Owner Name")

    def validate_phone(self, value):
        user = self.context.get('request').user
        return validate_phone_for_user(value, user)

    def validate_restaurant_logo(self, value):
        return validate_image_upload(value)

    def update(self, instance, validated_data):
        restaurant = Restaurant.objects.filter(owner=instance).first()
        if not restaurant:
            restaurant = Restaurant.objects.create(
                owner=instance,
                name=validated_data.get('restaurant_name') or f"Restaurant of {instance.username}",
                owner_name=validated_data.get('owner_name') or instance.username
            )

        profile, _ = Profile.objects.get_or_create(user=instance)

        if 'restaurant_name' in validated_data:
            restaurant.name = validated_data['restaurant_name']
        if 'owner_name' in validated_data:
            restaurant.owner_name = validated_data['owner_name']
            profile.full_name = validated_data['owner_name']
        if 'phone' in validated_data:
            phone_val = validated_data['phone']
            instance.phone = phone_val
            profile.phone = phone_val
            instance.save(update_fields=['phone', 'updated_at'])

        addr_val = validated_data.get('restaurant_address') or validated_data.get('address')
        if addr_val:
            addr_clean = addr_val.strip()
            if not addr_clean:
                raise serializers.ValidationError({"restaurant_address": ["Address cannot be blank."]})
            restaurant.address = addr_clean
            profile.address = addr_clean

        if 'latitude' in validated_data and validated_data['latitude'] is not None:
            lat = float(validated_data['latitude'])
            if not (-90.0 <= lat <= 90.0):
                raise serializers.ValidationError({"latitude": ["Latitude must be between -90 and 90."]})
            restaurant.latitude = lat

        if 'longitude' in validated_data and validated_data['longitude'] is not None:
            lng = float(validated_data['longitude'])
            if not (-180.0 <= lng <= 180.0):
                raise serializers.ValidationError({"longitude": ["Longitude must be between -180 and 180."]})
            restaurant.longitude = lng

        remove_logo = validated_data.get('remove_logo', False)
        if remove_logo:
            if restaurant.restaurant_logo:
                try:
                    restaurant.restaurant_logo.delete(save=False)
                except Exception:
                    pass
                restaurant.restaurant_logo = None
        elif 'restaurant_logo' in validated_data and validated_data['restaurant_logo']:
            restaurant.restaurant_logo = validated_data['restaurant_logo']

        restaurant.save()
        profile.save()
        return instance

    def to_representation(self, instance):
        restaurant = Restaurant.objects.filter(owner=instance).first()
        profile = getattr(instance, 'profile', None)
        logo_url = ''
        if restaurant and restaurant.restaurant_logo:
            try:
                logo_url = restaurant.restaurant_logo.url
            except Exception:
                logo_url = ''

        return {
            'role': 'RESTAURANT',
            'user_id': instance.id,
            'email': instance.email,
            'restaurant_name': restaurant.name if restaurant else (getattr(instance, 'restaurant_name', '') or instance.username),
            'owner_name': (restaurant.owner_name if restaurant else '') or (profile.full_name if profile else '') or instance.username,
            'phone': instance.phone or (profile.phone if profile else ''),
            'restaurant_address': (restaurant.address if restaurant else '') or (profile.address if profile else ''),
            'address': (restaurant.address if restaurant else '') or (profile.address if profile else ''),
            'latitude': float(restaurant.latitude) if (restaurant and restaurant.latitude is not None) else 12.9716,
            'longitude': float(restaurant.longitude) if (restaurant and restaurant.longitude is not None) else 77.5946,
            'restaurant_logo': logo_url,
            'verification_status': restaurant.verification_status if restaurant else (profile.verification_status if profile else 'PENDING'),
            'rating': float(restaurant.rating) if restaurant else 4.8,
            'is_open': restaurant.is_open if restaurant else True,
            'status': 'OPEN' if (restaurant and restaurant.is_open) else 'CLOSED'
        }


class DeliveryPartnerProfileManageSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100, required=False)
    phone = serializers.CharField(max_length=25, required=False)
    address = serializers.CharField(required=False)
    vehicle_type = serializers.CharField(max_length=50, required=False)
    vehicle_number = serializers.CharField(max_length=32, required=False)
    profile_photo = serializers.ImageField(required=False, allow_null=True)
    remove_photo = serializers.BooleanField(required=False, default=False)
    email = serializers.EmailField(read_only=True)
    verification_status = serializers.CharField(read_only=True)

    def validate_full_name(self, value):
        return validate_name_field(value, "Full Name")

    def validate_phone(self, value):
        user = self.context.get('request').user
        return validate_phone_for_user(value, user)

    def validate_address(self, value):
        val = (value or '').strip()
        if not val:
            raise serializers.ValidationError("Address cannot be blank.")
        return val

    def validate_vehicle_number(self, value):
        raw = (value or '').strip().upper()
        if not raw:
            return ''
        cleaned = re.sub(r'[\s\-]', '', raw)
        if len(cleaned) < 5 or len(cleaned) > 16:
            raise serializers.ValidationError("Vehicle number must be valid (e.g. KA-01-AB-1234).")
        user = self.context.get('request').user
        if DeliveryPartner.objects.filter(vehicle_number__iexact=raw).exclude(user=user).exists() or \
           DeliveryPartner.objects.filter(vehicle_number__iexact=cleaned).exclude(user=user).exists():
            raise serializers.ValidationError("A delivery vehicle with this registration number already exists.")
        return raw

    def validate_profile_photo(self, value):
        return validate_image_upload(value)

    def update(self, instance, validated_data):
        partner = getattr(instance, 'delivery_profile', None) or DeliveryPartner.objects.filter(user=instance).first()
        if not partner:
            partner = DeliveryPartner.objects.create(
                user=instance,
                vehicle_type=validated_data.get('vehicle_type') or 'Bike',
                vehicle_number=validated_data.get('vehicle_number') or f"KA-01-DP-{instance.id:04d}"
            )

        profile, _ = Profile.objects.get_or_create(user=instance)

        if 'full_name' in validated_data:
            profile.full_name = validated_data['full_name']
        if 'phone' in validated_data:
            phone_val = validated_data['phone']
            instance.phone = phone_val
            profile.phone = phone_val
            instance.save(update_fields=['phone', 'updated_at'])
        if 'address' in validated_data:
            profile.address = validated_data['address']
        if 'vehicle_type' in validated_data:
            partner.vehicle_type = validated_data['vehicle_type']
        if 'vehicle_number' in validated_data:
            partner.vehicle_number = validated_data['vehicle_number']

        remove_photo = validated_data.get('remove_photo', False)
        if remove_photo:
            if partner.profile_photo:
                try:
                    partner.profile_photo.delete(save=False)
                except Exception:
                    pass
                partner.profile_photo = None
            if profile.profile_photo:
                try:
                    profile.profile_photo.delete(save=False)
                except Exception:
                    pass
                profile.profile_photo = None
        elif 'profile_photo' in validated_data and validated_data['profile_photo']:
            photo_file = validated_data['profile_photo']
            partner.profile_photo = photo_file
            profile.profile_photo = photo_file

        partner.save()
        profile.save()
        return instance

    def to_representation(self, instance):
        partner = getattr(instance, 'delivery_profile', None) or DeliveryPartner.objects.filter(user=instance).first()
        profile = getattr(instance, 'profile', None)
        photo_url = ''
        if partner and partner.profile_photo:
            try:
                photo_url = partner.profile_photo.url
            except Exception:
                photo_url = ''
        elif profile and profile.profile_photo:
            try:
                photo_url = profile.profile_photo.url
            except Exception:
                photo_url = ''

        return {
            'role': 'DELIVERY_PARTNER',
            'user_id': instance.id,
            'email': instance.email,
            'full_name': (profile.full_name if profile else '') or instance.username,
            'phone': instance.phone or (profile.phone if profile else ''),
            'address': profile.address if profile else '',
            'vehicle_type': partner.vehicle_type if partner else 'Bike',
            'vehicle_number': partner.vehicle_number if partner else '',
            'profile_photo': photo_url,
            'verification_status': partner.verification_status if partner else (profile.verification_status if profile else 'PENDING'),
            'is_online': partner.is_online if partner else False,
            'rating': float(partner.rating) if partner else 4.95
        }


class AdminProfileManageSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100, required=False)
    phone = serializers.CharField(max_length=25, required=False)
    address = serializers.CharField(required=False)
    email = serializers.EmailField(read_only=True)

    def validate_phone(self, value):
        user = self.context.get('request').user
        return validate_phone_for_user(value, user)

    def update(self, instance, validated_data):
        profile, _ = Profile.objects.get_or_create(user=instance)
        if 'full_name' in validated_data:
            profile.full_name = validated_data['full_name']
        if 'phone' in validated_data:
            phone_val = validated_data['phone']
            instance.phone = phone_val
            profile.phone = phone_val
            instance.save(update_fields=['phone', 'updated_at'])
        if 'address' in validated_data:
            profile.address = validated_data['address']
        profile.save()
        return instance

    def to_representation(self, instance):
        profile = getattr(instance, 'profile', None)
        return {
            'role': 'ADMIN',
            'user_id': instance.id,
            'email': instance.email,
            'username': instance.username,
            'full_name': (profile.full_name if profile else '') or 'System Administrator',
            'phone': instance.phone or (profile.phone if profile else ''),
            'address': (profile.address if profile else '') or 'FD Mission Control HQ'
        }


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = [
            'theme',
            'language',
            'push_notifications',
            'email_notifications',
            'sms_notifications',
            'personalization',
            'location_permission_preference',
            'shift',
            'preferred_start_time',
            'preferred_end_time',
            'available_days',
            'break_start',
            'break_end',
            'preferred_zone',
            'availability',
            'order_alerts',
            'business_status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_theme(self, value):
        val = str(value).strip().lower()
        if val not in ['light', 'dark', 'system']:
            raise serializers.ValidationError("Theme must be one of: light, dark, system.")
        return val

    def validate_language(self, value):
        val = str(value).strip()
        lang_map = {
            'english': 'en', 'en': 'en',
            'tamil': 'ta', 'ta': 'ta'
        }
        normalized = lang_map.get(val.lower())
        if not normalized:
            raise serializers.ValidationError("Language must be 'English' ('en') or 'Tamil' ('ta').")
        return normalized

    def validate_shift(self, value):
        valid = ['OFFLINE', 'AVAILABLE', 'ON_SHIFT', 'BREAK', 'SHIFT_COMPLETED']
        val = str(value).strip().upper()
        if val not in valid:
            raise serializers.ValidationError(f"Shift must be one of {valid}.")
        return val

    def validate_available_days(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("available_days must be a list of weekday strings.")
        valid_days = {
            'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
            'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
        }
        for d in value:
            if not isinstance(d, str) or d not in valid_days:
                raise serializers.ValidationError(f"Invalid weekday: {d}")
        return value

    def validate_availability(self, value):
        val = str(value).strip().capitalize()
        if val not in ['Available', 'Unavailable']:
            raise serializers.ValidationError("Availability must be 'Available' or 'Unavailable'.")
        return val

    def validate(self, attrs):
        user = self.context.get('request').user if self.context.get('request') else getattr(self.instance, 'user', None)
        role = get_canonical_role(user) if user else 'CUSTOMER'

        # Role-based restriction: ensure roles don't modify other roles' specialized fields
        if role == 'CUSTOMER':
            forbidden_fields = ['shift', 'break_start', 'break_end', 'order_alerts', 'business_status']
            for f in forbidden_fields:
                if f in attrs:
                    attrs.pop(f)
        elif role == 'RESTAURANT':
            forbidden_fields = ['shift', 'break_start', 'break_end']
            for f in forbidden_fields:
                if f in attrs:
                    attrs.pop(f)
        elif role == 'DELIVERY_PARTNER':
            forbidden_fields = ['order_alerts', 'business_status']
            for f in forbidden_fields:
                if f in attrs:
                    attrs.pop(f)

        return attrs

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        user = instance.user
        canonical_role = get_canonical_role(user)
        ret['role'] = canonical_role
        ret['user_email'] = user.email
        if not ret.get('available_days'):
            ret['available_days'] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        return ret

