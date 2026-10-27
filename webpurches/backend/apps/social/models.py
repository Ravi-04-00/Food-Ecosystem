from django.db import models
from apps.accounts.models import User
from apps.products.models import Restaurant, FoodItem
from apps.orders.models import Order

class SocialPost(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='social_posts')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, null=True, blank=True, related_name='social_posts')
    food_item = models.ForeignKey(FoodItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='social_posts')
    title = models.CharField(max_length=255)
    caption = models.TextField()
    image = models.URLField()
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post: {self.title} by {self.author.username}"


class SocialReel(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='social_reels')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, null=True, blank=True, related_name='social_reels')
    food_item = models.ForeignKey(FoodItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='social_reels')
    title = models.CharField(max_length=255)
    caption = models.TextField(blank=True)
    video_url = models.URLField()
    thumbnail = models.URLField(blank=True)
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    audio_title = models.CharField(max_length=150, default="WS Food Sizzle • Original Soundtrack")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Reel: {self.title} ({self.views_count} views)"


class PostLike(models.Model):
    post = models.ForeignKey(SocialPost, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user')


class ReelLike(models.Model):
    reel = models.ForeignKey(SocialReel, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('reel', 'user')


class PostComment(models.Model):
    post = models.ForeignKey(SocialPost, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class ReelComment(models.Model):
    reel = models.ForeignKey(SocialReel, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class UserFollow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    following_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='followers')
    following_restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, null=True, blank=True, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('follower', 'following_user'), ('follower', 'following_restaurant')]


class PhotoReview(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='photo_reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='photo_reviews')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=5.0)
    comment = models.TextField()
    photos = models.JSONField(default=list, blank=True)
    likes_count = models.PositiveIntegerField(default=0)
    reply = models.TextField(blank=True)
    replied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review ★{self.rating} by {self.user.username} on {self.restaurant.name}"
