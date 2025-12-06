'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useComments, useCreateComment, useDeleteComment, type Comment } from '@/lib/api/social';
import {
  MessageSquare,
  Heart,
  Reply,
  MoreHorizontal,
  Trash2,
  Edit2,
  Send,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

// Simple relative time formatter
function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

interface TokenCommentsProps {
  tokenAddress: string;
  chainId: number;
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
}: {
  comment: Comment;
  currentUserId?: string;
  onReply: (commentId: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const isOwner = currentUserId === comment.userId;
  const displayName = comment.user?.displayName || comment.user?.username || 'Anonymous';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex gap-3 py-4 border-b border-border/50 last:border-0">
      <Link href={`/profile/${comment.user?.username || comment.userId}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.user?.avatarUrl || undefined} />
          <AvatarFallback className="bg-gradient-fire text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${comment.user?.username || comment.userId}`}
              className="font-medium hover:underline"
            >
              {displayName}
            </Link>
            {comment.isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="mt-1 text-sm">{comment.content}</p>
        <div className="flex items-center gap-4 mt-2">
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <Heart className="h-3.5 w-3.5" />
            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
          </button>
          <button
            onClick={() => onReply(comment.id)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <Reply className="h-3.5 w-3.5" />
            Reply
          </button>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-border/50 space-y-3">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <Link href={`/profile/${reply.user?.username || reply.userId}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={reply.user?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-muted text-xs">
                      {(reply.user?.displayName || reply.user?.username || 'A').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${reply.user?.username || reply.userId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {reply.user?.displayName || reply.user?.username || 'Anonymous'}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TokenComments({ tokenAddress, chainId }: TokenCommentsProps) {
  const { user, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data, isLoading, refetch } = useComments(tokenAddress, chainId, page);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      await createComment.mutateAsync({
        tokenAddress,
        chainId,
        content: newComment.trim(),
        parentId: replyingTo || undefined,
      });
      setNewComment('');
      setReplyingTo(null);
      refetch();
      toast.success('Comment posted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync(commentId);
      refetch();
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    // Focus on the textarea
    const textarea = document.getElementById('comment-input');
    textarea?.focus();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Comments
          {data?.total ? (
            <span className="text-sm font-normal text-muted-foreground">
              ({data.total})
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Comment Input */}
        {isAuthenticated ? (
          <div className="mb-6">
            {replyingTo && (
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Reply className="h-4 w-4" />
                Replying to comment
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-primary hover:underline"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback className="bg-gradient-fire text-white text-xs">
                  {(user?.displayName || user?.username || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  id="comment-input"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={!newComment.trim() || createComment.isPending}
                    size="sm"
                  >
                    {createComment.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>{' '}
              to post a comment
            </p>
          </div>
        )}

        {/* Comments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.comments && data.comments.length > 0 ? (
          <>
            <div className="divide-y divide-border/50">
              {data.comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.id}
                  onReply={handleReply}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No comments yet</p>
            <p className="text-sm text-muted-foreground">Be the first to comment!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
