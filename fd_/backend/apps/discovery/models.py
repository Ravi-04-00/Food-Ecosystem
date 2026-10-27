from django.db import models
from apps.accounts.models import User

class UserSearchHistory(models.Model):
    """
    Persisted recent search queries for authenticated customers.
    Enables quick history suggestions and instant one-click re-search.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='search_queries')
    query = models.CharField(max_length=255, db_index=True)
    results_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User Search History'
        verbose_name_plural = 'User Search Histories'
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.user.username}: {self.query} ({self.created_at})"
