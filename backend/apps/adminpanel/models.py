from django.db import models
from apps.accounts.models import User

class PlatformConfig(models.Model):
    """
    Stores platform operational and financial configurations.
    Modifications are tracked in AuditLog with admin user identity and reasons.
    """
    key = models.CharField(max_length=64, unique=True, db_index=True)
    value = models.JSONField(default=dict)
    description = models.CharField(max_length=255, blank=True)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='platform_config_updates'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['key']
        verbose_name = 'Platform Configuration'
        verbose_name_plural = 'Platform Configurations'

    def __str__(self):
        return f"{self.key}: {self.value}"
