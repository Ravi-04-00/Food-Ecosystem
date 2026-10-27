from rest_framework import serializers
from .models import SocialPost, SocialReel, PostLike, ReelLike, PostComment, ReelComment, UserFollow, PhotoReview

class PostCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.CharField(source='user.avatar', read_only=True)

    class Meta:
        model = PostComment
        fields = ['id', 'user', 'username', 'user_avatar', 'text', 'created_at']
        read_only_fields = ['user', 'created_at']


class SocialPostSerializer(serializers.ModelSerializer):
    comments = PostCommentSerializer(many=True, read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = SocialPost
        fields = ['id', 'author', 'author_name', 'restaurant', 'restaurant_name', 'food_item', 'title', 'caption', 'image', 'likes_count', 'comments_count', 'comments', 'is_liked', 'created_at']
        read_only_fields = ['author', 'likes_count', 'comments_count', 'created_at']

    def get_is_liked(self, obj):
        user = self.context.get('request').user if 'request' in self.context else None
        if user and user.is_authenticated:
            return PostLike.objects.filter(post=obj, user=user).exists()
        return False


class ReelCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.CharField(source='user.avatar', read_only=True)

    class Meta:
        model = ReelComment
        fields = ['id', 'user', 'username', 'user_avatar', 'text', 'created_at']
        read_only_fields = ['user', 'created_at']


class SocialReelSerializer(serializers.ModelSerializer):
    comments = ReelCommentSerializer(many=True, read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = SocialReel
        fields = ['id', 'author', 'restaurant', 'restaurant_name', 'food_item', 'title', 'caption', 'video_url', 'thumbnail', 'likes_count', 'comments_count', 'views_count', 'audio_title', 'comments', 'is_liked', 'created_at']
        read_only_fields = ['author', 'likes_count', 'comments_count', 'views_count', 'created_at']

    def get_is_liked(self, obj):
        user = self.context.get('request').user if 'request' in self.context else None
        if user and user.is_authenticated:
            return ReelLike.objects.filter(reel=obj, user=user).exists()
        return False


class PhotoReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.CharField(source='user.avatar', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)

    class Meta:
        model = PhotoReview
        fields = ['id', 'restaurant', 'restaurant_name', 'user', 'username', 'user_avatar', 'order', 'rating', 'comment', 'photos', 'likes_count', 'reply', 'replied_at', 'created_at']
        read_only_fields = ['user', 'created_at']
