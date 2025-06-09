import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  PhotoIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

const CreatePostModal = ({ isOpen, onClose, onPostCreated, editPost = null }) => {
  const { user } = useSelector((state) => state.auth);
  const [postData, setPostData] = useState({
    content: '',
    images: []
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editPost) {
      setPostData({
        content: editPost.content || '',
        images: editPost.images || []
      });
      setPreviewImages(editPost.images || []);
    } else {
      setPostData({ content: '', images: [] });
      setPreviewImages([]);
      setImageFiles([]);
    }
  }, [editPost, isOpen]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImages(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!postData.content.trim() && previewImages.length === 0) {
      toast.error('Please add some content or images to your post');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('content', postData.content);
      
      // Add new image files
      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      // If editing, add existing images
      if (editPost && editPost.images) {
        editPost.images.forEach(image => {
          formData.append('existingImages', image);
        });
      }

      const url = editPost 
        ? `http://localhost:5000/api/posts/${editPost._id}`
        : 'http://localhost:5000/api/posts';
      
      const method = editPost ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editPost ? 'Post updated successfully!' : 'Post created successfully!');
        onPostCreated(data.post);
        onClose();
        // Reset form
        setPostData({ content: '', images: [] });
        setPreviewImages([]);
        setImageFiles([]);
      } else {
        toast.error(data.message || 'Failed to save post');
      }
    } catch (error) {
      console.error('Post submission error:', error);
      toast.error('An error occurred while saving the post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-start space-x-4 mb-4">
            <img
              src={user?.profilePhoto 
                ? (user.profilePhoto.startsWith('http') 
                    ? user.profilePhoto 
                    : `http://localhost:5000${user.profilePhoto}`)
                : 'https://via.placeholder.com/40x40/cccccc/666666?text=U'
              }
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {String(user?.fullName || user?.name || 'User')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Public post</p>
            </div>
          </div>

          <div className="mb-4">
            <textarea
              value={postData.content}
              onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Image Upload */}
          <div className="mb-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
              <div className="text-center">
                <PhotoIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
                <div className="mt-2">
                  <label className="cursor-pointer">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Add photos to your post
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>
            </div>
          </div>

          {/* Image Previews */}
          {previewImages.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previewImages.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Saving...' : (editPost ? 'Update Post' : 'Post')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PostCard = ({ post, onEdit, onDelete, onLike, currentUserId }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    setIsLiked(post.likes?.includes(currentUserId) || false);
    setLikesCount(post.likes?.length || 0);
    setComments(post.comments || []);
  }, [post.likes, post.comments, currentUserId]);

  const handleLike = async () => {
    // Optimistic update for instant feedback
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
        if (onLike) onLike(post._id, data.isLiked);
        
        // Show success feedback
        if (data.isLiked) {
          toast.success('❤️ Liked!', { duration: 1000 });
        }
      } else {
        // Revert optimistic update on error
        setIsLiked(previousIsLiked);
        setLikesCount(previousLikesCount);
        toast.error('Failed to update like');
      }
    } catch (error) {
      console.error('Like error:', error);
      // Revert optimistic update on error
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      toast.error('Failed to update like');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${post._id}/comments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Fetch comments error:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmittingComment(true);
    const commentContent = newComment.trim();
    setNewComment(''); // Clear immediately for better UX
    
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentContent })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        toast.success('💬 Comment added!', { duration: 1500 });
      } else {
        const errorData = await response.json();
        setNewComment(commentContent); // Restore comment on error
        toast.error(errorData.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Add comment error:', error);
      setNewComment(commentContent); // Restore comment on error
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: `Post by ${post.author?.fullName || 'User'}`,
        text: post.content || 'Check out this post!',
        url: `${window.location.origin}/post/${post._id}`
      };
      
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('🚀 Shared successfully!', { duration: 1500 });
      } else {
        // Fallback: copy to clipboard
        const shareUrl = `${window.location.origin}/post/${post._id}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('📋 Link copied to clipboard!', { duration: 2000 });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        // Fallback to clipboard if sharing fails
        try {
          const shareUrl = `${window.location.origin}/post/${post._id}`;
          await navigator.clipboard.writeText(shareUrl);
          toast.success('📋 Link copied to clipboard!', { duration: 2000 });
        } catch (clipboardError) {
          toast.error('Failed to share post');
        }
      }
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={post.author?.profilePhoto 
              ? (post.author.profilePhoto.startsWith('http') 
                  ? post.author.profilePhoto 
                  : `http://localhost:5000${post.author.profilePhoto}`)
              : 'https://via.placeholder.com/40x40/cccccc/666666?text=U'
            }
            alt={post.author?.fullName || 'User'}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {post.author?.fullName || post.author?.name || 'User'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(post.createdAt)}
            </p>
          </div>
        </div>
        
        {post.author?._id === currentUserId && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <EllipsisHorizontalIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={() => {
                    onEdit(post);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Post
                </button>
                <button
                  onClick={() => {
                    onDelete(post._id);
                    setShowMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-gray-900 dark:text-white leading-relaxed">{post.content}</p>
        </div>
      )}

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className="px-4 pb-3">
          <div className={`grid gap-2 ${
            post.images.length === 1 ? 'grid-cols-1' :
            post.images.length === 2 ? 'grid-cols-2' :
            'grid-cols-2 md:grid-cols-3'
          }`}>
            {post.images.map((image, index) => (
              <img
                key={index}
                src={image.startsWith('http') ? image : `http://localhost:5000${image}`}
                alt={`Post image ${index + 1}`}
                className="w-full h-64 object-contain bg-gray-100 dark:bg-gray-700 rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-all duration-200 transform hover:scale-110 ${
                isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
              }`}
            >
              {isLiked ? (
                <HeartIconSolid className="h-5 w-5 animate-pulse" />
              ) : (
                <HeartIcon className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{likesCount}</span>
            </button>
            
            <button 
              onClick={toggleComments}
              className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-all duration-200 transform hover:scale-105"
            >
              <ChatBubbleLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">{comments.length}</span>
            </button>
            
            <button 
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-green-500 transition-all duration-200 transform hover:scale-105"
            >
              <ShareIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="mt-4 mb-4">
            <div className="flex space-x-3">
              <img
                src={`https://via.placeholder.com/32x32/cccccc/666666?text=U`}
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingComment}
                className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {isSubmittingComment ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Posting...</span>
                  </div>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment._id} className="flex space-x-3">
                <img
                  src={comment.author?.profilePhoto 
                    ? (comment.author.profilePhoto.startsWith('http') 
                        ? comment.author.profilePhoto 
                        : `http://localhost:5000${comment.author.profilePhoto}`)
                    : 'https://via.placeholder.com/32x32/cccccc/666666?text=U'
                  }
                  alt={comment.author?.fullName || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                      {comment.author?.fullName || 'User'}
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200 text-sm">
                      {comment.content}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-3">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { CreatePostModal, PostCard };