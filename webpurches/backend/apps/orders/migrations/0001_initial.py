# Generated for orders app initial schema migration
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0001_initial'),
        ('products', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order_number', models.CharField(db_index=True, max_length=64, unique=True)),
                ('delivery_address_text', models.TextField(default='Sector 7, Cyber Heights, Neo Bengaluru')),
                ('status', models.CharField(choices=[('PLACED', 'Order Placed'), ('CONFIRMED', 'Order Confirmed by Kitchen'), ('ACCEPTED', 'Accepted by Kitchen'), ('PREPARING', 'Food in Kitchen Preparation'), ('READY_FOR_PICKUP', 'Ready for Delivery Handover'), ('READY', 'Ready for Delivery Handover'), ('PICKED_UP', 'Picked Up by Delivery Partner'), ('ON_THE_WAY', 'Delivery Partner En Route'), ('OUT_FOR_DELIVERY', 'Out for Delivery'), ('ARRIVING', 'Delivery Partner Arriving'), ('DELIVERED', 'Delivered to Customer'), ('CANCELLED', 'Order Cancelled')], default='PLACED', max_length=30)),
                ('otp', models.CharField(default='8492', max_length=6)),
                ('item_total', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                ('delivery_fee', models.DecimalField(decimal_places=2, default=30.0, max_digits=8)),
                ('taxes', models.DecimalField(decimal_places=2, default=0.0, max_digits=8)),
                ('platform_fee', models.DecimalField(decimal_places=2, default=15.0, max_digits=8)),
                ('discount', models.DecimalField(decimal_places=2, default=0.0, max_digits=8)),
                ('grand_total', models.DecimalField(decimal_places=2, default=0.0, max_digits=10)),
                ('payment_method', models.CharField(default='UPI (Instant)', max_length=64)),
                ('payment_status', models.CharField(choices=[('PAYMENT_PENDING', 'Payment Pending'), ('PAYMENT_PROCESSING', 'Payment Processing'), ('PAID', 'Payment Received'), ('FAILED', 'Payment Failed'), ('CANCELLED', 'Payment Cancelled'), ('REFUND_PENDING', 'Refund Pending'), ('REFUNDED', 'Refunded'), ('PARTIALLY_REFUNDED', 'Partially Refunded'), ('VERIFIED_PAID', 'Verified Paid'), ('COMPLETED', 'Completed')], default='PAYMENT_PENDING', max_length=32)),
                ('cooking_instructions', models.TextField(blank=True, default='')),
                ('customer_lat', models.DecimalField(decimal_places=6, default=12.9716, max_digits=9)),
                ('customer_lng', models.DecimalField(decimal_places=6, default=77.5946, max_digits=9)),
                ('restaurant_lat', models.DecimalField(decimal_places=6, default=12.978, max_digits=9)),
                ('restaurant_lng', models.DecimalField(decimal_places=6, default=77.601, max_digits=9)),
                ('rider_lat', models.DecimalField(decimal_places=6, default=12.975, max_digits=9)),
                ('rider_lng', models.DecimalField(decimal_places=6, default=77.598, max_digits=9)),
                ('eta_minutes', models.PositiveIntegerField(default=22)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='food_orders', to=settings.AUTH_USER_MODEL)),
                ('restaurant', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='orders', to='products.restaurant')),
                ('rider', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deliveries', to=settings.AUTH_USER_MODEL)),
                ('shipping_address', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='accounts.address')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('selected_addons', models.JSONField(blank=True, default=list)),
                ('food_item', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='products.fooditem')),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='orders.order')),
            ],
        ),
        migrations.CreateModel(
            name='OrderStatusHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('from_status', models.CharField(max_length=32)),
                ('to_status', models.CharField(max_length=32)),
                ('actor_role', models.CharField(default='SYSTEM', max_length=32)),
                ('reason', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='status_history', to='orders.order')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
