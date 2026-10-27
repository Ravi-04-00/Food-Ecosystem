from django.urls import path
from apps.accounts.support_views import (
    CustomerTicketListCreateView,
    CustomerTicketDetailView,
    CustomerTicketReplyView,
    CustomerTicketResolutionConfirmView,
    CustomerEligibleOrdersView,
    RestaurantTicketListView,
    RestaurantTicketDetailView,
    RestaurantTicketReplyView,
    DeliveryTicketListView,
    DeliveryTicketDetailView,
    DeliveryTicketReplyView,
    AdminTicketListView,
    AdminTicketDetailView,
    AdminTicketReplyView,
    AdminTicketAssignView,
    AdminTicketEscalateView,
    AdminTicketResolveView,
    AdminTicketCloseView,
    AdminAutoEscalateView,
    TicketAttachmentDownloadView
)
from apps.accounts.agent_views import (
    AgentQueueView,
    AgentTicketDetailView,
    AgentTicketClaimView,
    AgentTicketReplyView,
    AgentCallQueueView,
)

urlpatterns = [
    # Customer Support & Dispute URLs
    path('tickets/', CustomerTicketListCreateView.as_view(), name='customer_ticket_list_create'),
    path('tickets/<str:ticket_number>/', CustomerTicketDetailView.as_view(), name='customer_ticket_detail'),
    path('tickets/<str:ticket_number>/reply/', CustomerTicketReplyView.as_view(), name='customer_ticket_reply'),
    path('tickets/<str:ticket_number>/confirm-resolution/', CustomerTicketResolutionConfirmView.as_view(), name='customer_ticket_confirm_resolution'),
    path('tickets/<str:ticket_number>/attachments/<int:attachment_id>/download/', TicketAttachmentDownloadView.as_view(), name='ticket_attachment_download'),    path('orders/eligible/', CustomerEligibleOrdersView.as_view(), name='customer_eligible_orders'),

    # Restaurant Complaints URLs
    path('restaurant/tickets/', RestaurantTicketListView.as_view(), name='restaurant_ticket_list'),
    path('restaurant/tickets/<str:ticket_number>/', RestaurantTicketDetailView.as_view(), name='restaurant_ticket_detail'),
    path('restaurant/tickets/<str:ticket_number>/reply/', RestaurantTicketReplyView.as_view(), name='restaurant_ticket_reply'),

    # Delivery Partner Complaints URLs
    path('delivery/tickets/', DeliveryTicketListView.as_view(), name='delivery_ticket_list'),
    path('delivery/tickets/<str:ticket_number>/', DeliveryTicketDetailView.as_view(), name='delivery_ticket_detail'),
    path('delivery/tickets/<str:ticket_number>/reply/', DeliveryTicketReplyView.as_view(), name='delivery_ticket_reply'),

    # Admin Operations URLs
    path('admin/tickets/', AdminTicketListView.as_view(), name='admin_ticket_list'),
    path('admin/tickets/<str:ticket_number>/', AdminTicketDetailView.as_view(), name='admin_ticket_detail'),
    path('admin/tickets/<str:ticket_number>/reply/', AdminTicketReplyView.as_view(), name='admin_ticket_reply'),
    path('admin/tickets/<str:ticket_number>/assign/', AdminTicketAssignView.as_view(), name='admin_ticket_assign'),
    path('admin/tickets/<str:ticket_number>/escalate/', AdminTicketEscalateView.as_view(), name='admin_ticket_escalate'),
    path('admin/tickets/<str:ticket_number>/resolve/', AdminTicketResolveView.as_view(), name='admin_ticket_resolve'),
    path('admin/tickets/<str:ticket_number>/close/', AdminTicketCloseView.as_view(), name='admin_ticket_close'),
    path('admin/auto-escalate/', AdminAutoEscalateView.as_view(), name='admin_auto_escalate'),

    # Support-agent queue (is_support_agent flag only, never superuser)
    path('agent/queue/', AgentQueueView.as_view(), name='agent_queue'),
    path('agent/tickets/<str:ticket_number>/', AgentTicketDetailView.as_view(), name='agent_ticket_detail'),
    path('agent/tickets/<str:ticket_number>/claim/', AgentTicketClaimView.as_view(), name='agent_ticket_claim'),
    path('agent/tickets/<str:ticket_number>/reply/', AgentTicketReplyView.as_view(), name='agent_ticket_reply'),
    path('agent/calls/', AgentCallQueueView.as_view(), name='agent_call_queue'),
]
