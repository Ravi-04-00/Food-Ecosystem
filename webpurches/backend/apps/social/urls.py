from django.urls import path
from .views import (
    SocialPostListCreateView, SocialPostLikeView, SocialPostCommentView,
    SocialReelListCreateView, SocialReelLikeView, SocialReelCommentView,
    UserFollowToggleView, PhotoReviewListCreateView, ReviewReplyView
)

urlpatterns = [
    # Posts Feed
    path('posts/', SocialPostListCreateView.as_view(), name='social_posts'),
    path('posts/<int:pk>/like/', SocialPostLikeView.as_view(), name='social_post_like'),
    path('posts/<int:pk>/comment/', SocialPostCommentView.as_view(), name='social_post_comment'),
    
    # Reels Feed
    path('reels/', SocialReelListCreateView.as_view(), name='social_reels'),
    path('reels/<int:pk>/like/', SocialReelLikeView.as_view(), name='social_reel_like'),
    path('reels/<int:pk>/comment/', SocialReelCommentView.as_view(), name='social_reel_comment'),
    
    # Follow
    path('follow/', UserFollowToggleView.as_view(), name='social_follow'),
    
    # Photo Reviews
    path('reviews/', PhotoReviewListCreateView.as_view(), name='photo_reviews'),
    path('reviews/<int:pk>/reply/', ReviewReplyView.as_view(), name='photo_review_reply'),
]
