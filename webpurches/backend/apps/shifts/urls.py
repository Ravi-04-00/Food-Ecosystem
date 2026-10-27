from django.urls import path
from .views import (
    ShiftSlotListView, ShiftCalendarView, BookShiftView,
    CancelShiftBookingView, ShiftCheckInView, ShiftCheckOutView,
    ShiftBreakStartView, ShiftBreakEndView, ShiftSummaryView,
    ShiftLeaderboardView, ShiftSwapListCreateView, ShiftBonusListView
)

urlpatterns = [
    path('slots/', ShiftSlotListView.as_view(), name='shift_slots'),
    path('calendar/', ShiftCalendarView.as_view(), name='shift_calendar'),
    path('book/', BookShiftView.as_view(), name='shift_book'),
    path('cancel/', CancelShiftBookingView.as_view(), name='shift_cancel'),
    path('check-in/', ShiftCheckInView.as_view(), name='shift_check_in'),
    path('check-out/', ShiftCheckOutView.as_view(), name='shift_check_out'),
    path('break/start/', ShiftBreakStartView.as_view(), name='shift_break_start'),
    path('break/end/', ShiftBreakEndView.as_view(), name='shift_break_end'),
    path('summary/', ShiftSummaryView.as_view(), name='shift_summary'),
    path('leaderboard/', ShiftLeaderboardView.as_view(), name='shift_leaderboard'),
    path('swaps/', ShiftSwapListCreateView.as_view(), name='shift_swaps'),
    path('bonuses/', ShiftBonusListView.as_view(), name='shift_bonuses'),
]
