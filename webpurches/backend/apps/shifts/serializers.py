from rest_framework import serializers
from .models import ShiftSlot, Shift, ShiftBooking, CheckIn, BreakLog, ShiftSwap, ShiftBonus

class ShiftSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftSlot
        fields = '__all__'


class ShiftSerializer(serializers.ModelSerializer):
    slot = ShiftSlotSerializer(read_only=True)
    slot_id = serializers.PrimaryKeyRelatedField(queryset=ShiftSlot.objects.all(), source='slot', write_only=True)

    class Meta:
        model = Shift
        fields = ['id', 'slot', 'slot_id', 'date', 'zone', 'capacity', 'booked_count', 'waitlist_count', 'is_full', 'is_active']


class BreakLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreakLog
        fields = '__all__'


class CheckInSerializer(serializers.ModelSerializer):
    breaks = BreakLogSerializer(many=True, read_only=True)

    class Meta:
        model = CheckIn
        fields = '__all__'


class ShiftBookingSerializer(serializers.ModelSerializer):
    shift = ShiftSerializer(read_only=True)
    check_in = CheckInSerializer(read_only=True)
    rider_name = serializers.CharField(source='rider.username', read_only=True)

    class Meta:
        model = ShiftBooking
        fields = ['id', 'shift', 'rider', 'rider_name', 'date', 'status', 'waitlist_position', 'check_in', 'created_at']
        read_only_fields = ['rider', 'created_at']


class ShiftSwapSerializer(serializers.ModelSerializer):
    requester_name = serializers.CharField(source='requester.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True, default='Open')
    booking_details = ShiftBookingSerializer(source='booking', read_only=True)

    class Meta:
        model = ShiftSwap
        fields = ['id', 'booking', 'booking_details', 'requester', 'requester_name', 'receiver', 'receiver_name', 'reason', 'status', 'admin_approved', 'created_at']
        read_only_fields = ['requester', 'created_at']


class ShiftBonusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftBonus
        fields = '__all__'
