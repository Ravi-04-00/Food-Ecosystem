"""
Phase 21: Authoritative Metric & Accounting Definitions.
Strictly distinguishes Gross Order Value (GOV), Captured Payments,
Refunds, Discounts, Platform Fees, and Restaurant Settlement.
"""

REPORTING_TIMEZONE = "Asia/Kolkata"

METRIC_DEFINITIONS = {
    "gross_order_value": {
        "key": "gross_order_value",
        "title": "Gross Order Value (GOV)",
        "unit": "INR",
        "description": "Total nominal value of all food orders placed by customers during the selected period, inclusive of food subtotal, delivery fee, packaging fee, platform fee, and taxes, before discounts are applied.",
        "calculation": "Sum(Order.grand_total) across all orders placed in the reporting window.",
        "includes_cancelled": True,
        "is_revenue": False,
        "accounting_note": "GOV represents total transaction volume on the platform, NOT net company revenue."
    },
    "net_completed_order_value": {
        "key": "net_completed_order_value",
        "title": "Completed Order Value",
        "unit": "INR",
        "description": "Total order value for orders successfully fulfilled and delivered to customers (status = 'DELIVERED').",
        "calculation": "Sum(Order.grand_total) where Order.status = 'DELIVERED'.",
        "includes_cancelled": False,
        "is_revenue": False,
        "accounting_note": "Represents fulfilled volume generating platform fees and restaurant payouts."
    },
    "captured_payments": {
        "key": "captured_payments",
        "title": "Verified Captured Payments",
        "unit": "INR",
        "description": "Total verified monetary settlement collected from customers via integrated payment gateways (UPI, Cards, NetBanking, Escrow).",
        "calculation": "Sum(Payment.amount) where Payment.status = 'PAID' (or 'COMPLETED'). Excludes pending, processing, failed, and cancelled payment attempts.",
        "includes_cancelled": False,
        "is_revenue": False,
        "accounting_note": "Authoritative cash inflow verified against gateway webhooks."
    },
    "unverified_pending_payments": {
        "key": "unverified_pending_payments",
        "title": "Unverified / Pending Payments",
        "unit": "INR",
        "description": "Volume of payment sessions currently in progress, initiated, or awaiting gateway webhook confirmation.",
        "calculation": "Sum(Payment.amount) where Payment.status in ('PAYMENT_PENDING', 'PAYMENT_PROCESSING', 'PENDING').",
        "includes_cancelled": False,
        "is_revenue": False,
        "accounting_note": "Not recognized as cash until webhook verification completes."
    },
    "failed_payments": {
        "key": "failed_payments",
        "title": "Failed Payments",
        "unit": "INR",
        "description": "Total value of payments that failed due to card decline, bank timeout, UPI drop-off, or customer cancellation.",
        "calculation": "Sum(Payment.amount) where Payment.status in ('FAILED', 'CANCELLED').",
        "includes_cancelled": True,
        "is_revenue": False,
        "accounting_note": "Tracks lost conversion opportunities."
    },
    "verified_refunds": {
        "key": "verified_refunds",
        "title": "Verified Refunds",
        "unit": "INR",
        "description": "Authoritative total of refunds processed back to customers for cancelled or disputed orders.",
        "calculation": "Sum(Payment.refund_amount) where Payment.status in ('REFUNDED', 'PARTIALLY_REFUNDED') or Payment.refund_amount > 0.",
        "includes_cancelled": True,
        "is_revenue": False,
        "accounting_note": "Only counted when backed by verified payment refund entries."
    },
    "total_discounts": {
        "key": "total_discounts",
        "title": "Promotional & Loyalty Discounts",
        "unit": "INR",
        "description": "Combined value of promotional coupon subsidies and loyalty points discounts granted during checkout.",
        "calculation": "Sum(CouponRedemption.discount_amount) where status = 'COMMITTED' + Sum(Order.loyalty_discount).",
        "includes_cancelled": False,
        "is_revenue": False,
        "accounting_note": "Platform or merchant marketing subsidy deducted from customer payable."
    },
    "average_order_value": {
        "key": "average_order_value",
        "title": "Average Order Value (AOV)",
        "unit": "INR",
        "description": "Average transaction size per placed order during the selected period.",
        "calculation": "Gross Order Value divided by Total Orders placed.",
        "includes_cancelled": True,
        "is_revenue": False,
        "accounting_note": "Indicates customer basket size trends."
    },
    "platform_commission": {
        "key": "platform_commission",
        "title": "Platform Commission & Operational Fees",
        "unit": "INR",
        "description": "Authoritative platform earnings consisting of customer platform fees plus restaurant commission on completed food orders.",
        "calculation": "Sum(Order.platform_fee) + Sum(Order.item_total * 0.10) for completed orders.",
        "includes_cancelled": False,
        "is_revenue": True,
        "accounting_note": "Recognized platform operating revenue."
    },
    "restaurant_settlement": {
        "key": "restaurant_settlement",
        "title": "Restaurant Net Settlement",
        "unit": "INR",
        "description": "Net payable amount due to partner kitchens for delivered orders (Food Item Total + Packaging Fee minus platform commission).",
        "calculation": "Sum(Order.item_total + Order.packaging_fee - (Order.item_total * 0.10)) for completed orders.",
        "includes_cancelled": False,
        "is_revenue": False,
        "accounting_note": "Liability payable to restaurant partners."
    },
    "delivery_partner_payout": {
        "key": "delivery_partner_payout",
        "title": "Delivery Partner Payout",
        "unit": "INR",
        "description": "Earned compensation for active delivery partners comprising delivery fees and tips on completed deliveries.",
        "calculation": "Sum(Order.delivery_fee) + Sum(tips) on completed deliveries.",
        "includes_cancelled": False,
        "is_revenue": False,
        "accounting_note": "Disbursed to riders upon delivery completion."
    },
    "delivery_duration": {
        "key": "delivery_duration",
        "title": "Average Delivery Transit Duration",
        "unit": "Minutes",
        "description": "Elapsed time from kitchen food pickup (picked_up_at) to customer delivery completion (delivered_at).",
        "calculation": "Avg(delivered_at - picked_up_at) for completed assignments. Excludes records with missing, zero, or inverted timestamps.",
        "includes_cancelled": False,
        "is_revenue": False,
        "accounting_note": "Core operational SLA metric evaluated without arbitrary gamification."
    }
}
