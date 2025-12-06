import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('xferno_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// ========== TYPES ==========

export interface UserProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  accountType: string;
  createdAt: string;
  tokensCreated: number;
  followersCount: number;
  followingCount: number;
}

export interface Comment {
  id: string;
  userId: string;
  tokenAddress: string;
  chainId: number;
  content: string;
  parentId: string | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
  likeCount: number;
  replies?: Comment[];
}

export interface Activity {
  id: string;
  userId: string;
  type: string;
  targetType: string | null;
  targetId: string | null;
  metadata: any;
  createdAt: string;
  user?: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

// ========== USER PROFILE ==========

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE}/api/social/profile/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
}

export async function getUserByUsername(username: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE}/api/social/profile/username/${username}`);
  if (!response.ok) throw new Error('User not found');
  return response.json();
}

export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
  });
}

// ========== FOLLOWS ==========

export async function followUser(userId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/social/follow/${userId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to follow user');
  return response.json();
}

export async function unfollowUser(userId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/social/follow/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to unfollow user');
  return response.json();
}

export async function isFollowing(userId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api/social/is-following/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) return false;
  const data = await response.json();
  return data.isFollowing;
}

export function useIsFollowing(userId?: string) {
  return useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: () => isFollowing(userId!),
    enabled: !!userId,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: followUser,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unfollowUser,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
    },
  });
}

// ========== TOKEN FOLLOWS ==========

export async function followToken(tokenAddress: string, chainId: number): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/social/token/follow`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tokenAddress, chainId }),
  });
  if (!response.ok) throw new Error('Failed to follow token');
  return response.json();
}

export async function unfollowToken(tokenAddress: string, chainId: number): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/social/token/follow/${tokenAddress}?chainId=${chainId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to unfollow token');
  return response.json();
}

export async function isFollowingToken(tokenAddress: string, chainId: number): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api/social/token/is-following/${tokenAddress}?chainId=${chainId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) return false;
  const data = await response.json();
  return data.isFollowing;
}

export function useIsFollowingToken(tokenAddress?: string, chainId = 11155111) {
  return useQuery({
    queryKey: ['isFollowingToken', tokenAddress, chainId],
    queryFn: () => isFollowingToken(tokenAddress!, chainId),
    enabled: !!tokenAddress,
  });
}

// ========== COMMENTS ==========

export async function createComment(
  tokenAddress: string,
  chainId: number,
  content: string,
  parentId?: string,
): Promise<Comment> {
  const response = await fetch(`${API_BASE}/api/social/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tokenAddress, chainId, content, parentId }),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to create comment');
  }
  return response.json();
}

export async function updateComment(commentId: string, content: string): Promise<Comment> {
  const response = await fetch(`${API_BASE}/api/social/comments/${commentId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error('Failed to update comment');
  return response.json();
}

export async function deleteComment(commentId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/social/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete comment');
  return response.json();
}

export async function getComments(
  tokenAddress: string,
  chainId: number,
  page = 1,
  limit = 20,
): Promise<{ comments: Comment[]; total: number; page: number; totalPages: number }> {
  const response = await fetch(
    `${API_BASE}/api/social/comments/${tokenAddress}?chainId=${chainId}&page=${page}&limit=${limit}`,
  );
  if (!response.ok) throw new Error('Failed to fetch comments');
  return response.json();
}

export function useComments(tokenAddress?: string, chainId = 11155111, page = 1) {
  return useQuery({
    queryKey: ['comments', tokenAddress, chainId, page],
    queryFn: () => getComments(tokenAddress!, chainId, page),
    enabled: !!tokenAddress,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tokenAddress, chainId, content, parentId }: {
      tokenAddress: string;
      chainId: number;
      content: string;
      parentId?: string;
    }) => createComment(tokenAddress, chainId, content, parentId),
    onSuccess: (_, { tokenAddress, chainId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', tokenAddress, chainId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

// ========== COMMENT LIKES ==========

export async function likeComment(commentId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/social/comments/${commentId}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to like comment');
  return response.json();
}

export async function unlikeComment(commentId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/api/social/comments/${commentId}/like`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to unlike comment');
  return response.json();
}

export async function hasLikedComment(commentId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api/social/comments/${commentId}/has-liked`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) return false;
  const data = await response.json();
  return data.hasLiked;
}

// ========== ACTIVITY FEED ==========

export async function getUserActivity(
  userId: string,
  page = 1,
  limit = 20,
): Promise<{ activities: Activity[]; total: number; page: number; totalPages: number }> {
  const response = await fetch(
    `${API_BASE}/api/social/activity/user/${userId}?page=${page}&limit=${limit}`,
  );
  if (!response.ok) throw new Error('Failed to fetch activity');
  return response.json();
}

export async function getFeedActivity(
  page = 1,
  limit = 20,
): Promise<{ activities: Activity[]; total: number; page: number; totalPages: number }> {
  const response = await fetch(
    `${API_BASE}/api/social/activity/feed?page=${page}&limit=${limit}`,
    { headers: getAuthHeaders() },
  );
  if (!response.ok) throw new Error('Failed to fetch feed');
  return response.json();
}

export function useUserActivity(userId?: string, page = 1) {
  return useQuery({
    queryKey: ['userActivity', userId, page],
    queryFn: () => getUserActivity(userId!, page),
    enabled: !!userId,
  });
}

export function useFeedActivity(page = 1) {
  return useQuery({
    queryKey: ['feedActivity', page],
    queryFn: () => getFeedActivity(page),
  });
}
