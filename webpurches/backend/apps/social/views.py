from django.utils import timezone
from django.db import transaction
from rest_framework import views, generics, permissions, status
from rest_framework.response import Response
from .models import SocialPost, SocialReel, PostLike, ReelLike, PostComment, ReelComment, UserFollow, PhotoReview
from .serializers import SocialPostSerializer, SocialReelSerializer, PostCommentSerializer, ReelCommentSerializer, PhotoReviewSerializer
from apps.products.models import Restaurant

class SocialPostListCreateView(generics.ListCreateAPIView):
    queryset = SocialPost.objects.all()
    serializer_class = SocialPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant_id')
        restaurant = Restaurant.objects.filter(id=restaurant_id).first() if restaurant_id else None
        serializer.save(author=self.request.user, restaurant=restaurant)


class SocialPostLikeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = SocialPost.objects.filter(id=pk).first()
        if not post:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

        like = PostLike.objects.filter(post=post, user=request.user).first()
        if like:
            like.delete()
            post.likes_count = max(0, post.likes_count - 1)
            post.save()
            return Response({'liked': False, 'likes_count': post.likes_count})
        else:
            PostLike.objects.create(post=post, user=request.user)
            post.likes_count += 1
            post.save()
            return Response({'liked': True, 'likes_count': post.likes_count})


class SocialPostCommentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = SocialPost.objects.filter(id=pk).first()
        if not post:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Comment text required'}, status=status.HTTP_400_BAD_REQUEST)

        comment = PostComment.objects.create(post=post, user=request.user, text=text)
        post.comments_count += 1
        post.save()

        return Response(PostCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class SocialReelListCreateView(generics.ListCreateAPIView):
    queryset = SocialReel.objects.all()
    serializer_class = SocialReelSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant_id')
        restaurant = Restaurant.objects.filter(id=restaurant_id).first() if restaurant_id else None
        serializer.save(author=self.request.user, restaurant=restaurant)


class SocialReelLikeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        reel = SocialReel.objects.filter(id=pk).first()
        if not reel:
            return Response({'error': 'Reel not found'}, status=status.HTTP_404_NOT_FOUND)

        like = ReelLike.objects.filter(reel=reel, user=request.user).first()
        if like:
            like.delete()
            reel.likes_count = max(0, reel.likes_count - 1)
            reel.save()
            return Response({'liked': False, 'likes_count': reel.likes_count})
        else:
            ReelLike.objects.create(reel=reel, user=request.user)
            reel.likes_count += 1
            reel.save()
            return Response({'liked': True, 'likes_count': reel.likes_count})


class SocialReelCommentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        reel = SocialReel.objects.filter(id=pk).first()
        if not reel:
            return Response({'error': 'Reel not found'}, status=status.HTTP_404_NOT_FOUND)

        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Comment text required'}, status=status.HTTP_400_BAD_REQUEST)

        comment = ReelComment.objects.create(reel=reel, user=request.user, text=text)
        reel.comments_count += 1
        reel.save()

        return Response(ReelCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class UserFollowToggleView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        restaurant_id = request.data.get('restaurant_id')
        if not restaurant_id:
            return Response({'error': 'restaurant_id required'}, status=status.HTTP_400_BAD_REQUEST)

        restaurant = Restaurant.objects.filter(id=restaurant_id).first()
        if not restaurant:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)

        follow = UserFollow.objects.filter(follower=request.user, following_restaurant=restaurant).first()
        if follow:
            follow.delete()
            return Response({'following': False, 'message': f'Unfollowed {restaurant.name}'})
        else:
            UserFollow.objects.create(follower=request.user, following_restaurant=restaurant)
            return Response({'following': True, 'message': f'Now following {restaurant.name}'})


class PhotoReviewListCreateView(generics.ListCreateAPIView):
    queryset = PhotoReview.objects.all()
    serializer_class = PhotoReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        restaurant_id = self.request.query_params.get('restaurant_id')
        if restaurant_id:
            qs = qs.filter(restaurant_id=restaurant_id)
        return qs

    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant_id')
        restaurant = Restaurant.objects.filter(id=restaurant_id).first()
        serializer.save(user=self.request.user, restaurant=restaurant)


class ReviewReplyView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        review = PhotoReview.objects.filter(id=pk).first()
        if not review:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

        reply_text = request.data.get('reply', '').strip()
        review.reply = reply_text
        review.replied_at = timezone.now()
        review.save()

        return Response(PhotoReviewSerializer(review).data)
