import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== USER PROFILE ==========

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        accountType: true,
        createdAt: true,
        _count: {
          select: {
            createdTokens: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get follower/following counts
    const [followersCount, followingCount] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      ...user,
      tokensCreated: user._count.createdTokens,
      followersCount,
      followingCount,
    };
  }

  async getUserByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        accountType: true,
        createdAt: true,
        _count: {
          select: {
            createdTokens: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [followersCount, followingCount] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: user.id } }),
      this.prisma.follow.count({ where: { followerId: user.id } }),
    ]);

    return {
      ...user,
      tokensCreated: user._count.createdTokens,
      followersCount,
      followingCount,
    };
  }

  // ========== FOLLOW USERS ==========

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Create follow relationship
    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      create: { followerId, followingId },
      update: {},
    });

    // Create activity
    await this.createActivity(followerId, 'FOLLOW', 'USER', followingId);

    return { success: true, message: 'User followed' };
  }

  async unfollowUser(followerId: string, followingId: string) {
    await this.prisma.follow.deleteMany({
      where: { followerId, followingId },
    });

    return { success: true, message: 'User unfollowed' };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          // Include follower user info - need raw query since no relation
        },
      }),
      this.prisma.follow.count({ where: { followingId: userId } }),
    ]);

    // Get user details for followers
    const followerIds = followers.map(f => f.followerId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: followerIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    const followersWithUsers = followers.map(f => ({
      ...f,
      follower: userMap.get(f.followerId),
    }));

    return {
      followers: followersWithUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    // Get user details for following
    const followingIds = following.map(f => f.followingId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: followingIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    const followingWithUsers = following.map(f => ({
      ...f,
      following: userMap.get(f.followingId),
    }));

    return {
      following: followingWithUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    return !!follow;
  }

  // ========== TOKEN FOLLOWS ==========

  async followToken(userId: string, tokenAddress: string, chainId: number) {
    await this.prisma.tokenFollow.upsert({
      where: {
        userId_tokenAddress_chainId: { userId, tokenAddress: tokenAddress.toLowerCase(), chainId },
      },
      create: { userId, tokenAddress: tokenAddress.toLowerCase(), chainId },
      update: {},
    });

    await this.createActivity(userId, 'TOKEN_FOLLOW', 'TOKEN', tokenAddress);

    return { success: true, message: 'Token followed' };
  }

  async unfollowToken(userId: string, tokenAddress: string, chainId: number) {
    await this.prisma.tokenFollow.deleteMany({
      where: { userId, tokenAddress: tokenAddress.toLowerCase(), chainId },
    });

    return { success: true, message: 'Token unfollowed' };
  }

  async getFollowedTokens(userId: string, chainId: number) {
    return this.prisma.tokenFollow.findMany({
      where: { userId, chainId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async isFollowingToken(userId: string, tokenAddress: string, chainId: number): Promise<boolean> {
    const follow = await this.prisma.tokenFollow.findUnique({
      where: {
        userId_tokenAddress_chainId: { userId, tokenAddress: tokenAddress.toLowerCase(), chainId },
      },
    });
    return !!follow;
  }

  // ========== COMMENTS ==========

  async createComment(
    userId: string,
    tokenAddress: string,
    chainId: number,
    content: string,
    parentId?: string,
  ) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content is required');
    }

    if (content.length > 1000) {
      throw new BadRequestException('Comment must be less than 1000 characters');
    }

    // Verify parent exists if replying
    if (parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        userId,
        tokenAddress: tokenAddress.toLowerCase(),
        chainId,
        content: content.trim(),
        parentId,
      },
    });

    await this.createActivity(userId, 'COMMENT', 'TOKEN', tokenAddress, { commentId: comment.id });

    return comment;
  }

  async updateComment(userId: string, commentId: string, content: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Cannot edit another user\'s comment');
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Comment content is required');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        isEdited: true,
      },
    });
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Cannot delete another user\'s comment');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { success: true, message: 'Comment deleted' };
  }

  async getComments(tokenAddress: string, chainId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          tokenAddress: tokenAddress.toLowerCase(),
          chainId,
          parentId: null, // Only top-level comments
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          replies: {
            orderBy: { createdAt: 'asc' },
            take: 3, // Show first 3 replies
          },
        },
      }),
      this.prisma.comment.count({
        where: {
          tokenAddress: tokenAddress.toLowerCase(),
          chainId,
          parentId: null,
        },
      }),
    ]);

    // Get user details for all comments
    const userIds = new Set<string>();
    comments.forEach(c => {
      userIds.add(c.userId);
      c.replies.forEach(r => userIds.add(r.userId));
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Get like counts
    const commentIds = [...comments.map(c => c.id), ...comments.flatMap(c => c.replies.map(r => r.id))];
    const likeCounts = await this.prisma.commentLike.groupBy({
      by: ['commentId'],
      where: { commentId: { in: commentIds } },
      _count: true,
    });
    const likeMap = new Map(likeCounts.map(l => [l.commentId, l._count]));

    const commentsWithDetails = comments.map(c => ({
      ...c,
      user: userMap.get(c.userId),
      likeCount: likeMap.get(c.id) || 0,
      replies: c.replies.map(r => ({
        ...r,
        user: userMap.get(r.userId),
        likeCount: likeMap.get(r.id) || 0,
      })),
    }));

    return {
      comments: commentsWithDetails,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReplies(commentId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { parentId: commentId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.comment.count({ where: { parentId: commentId } }),
    ]);

    // Get user details
    const userIds = replies.map(r => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const repliesWithUsers = replies.map(r => ({
      ...r,
      user: userMap.get(r.userId),
    }));

    return {
      replies: repliesWithUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ========== COMMENT LIKES ==========

  async likeComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.prisma.commentLike.upsert({
      where: {
        userId_commentId: { userId, commentId },
      },
      create: { userId, commentId },
      update: {},
    });

    return { success: true };
  }

  async unlikeComment(userId: string, commentId: string) {
    await this.prisma.commentLike.deleteMany({
      where: { userId, commentId },
    });

    return { success: true };
  }

  async hasLikedComment(userId: string, commentId: string): Promise<boolean> {
    const like = await this.prisma.commentLike.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });
    return !!like;
  }

  // ========== ACTIVITY FEED ==========

  async createActivity(
    userId: string,
    type: string,
    targetType?: string,
    targetId?: string,
    metadata?: any,
  ) {
    return this.prisma.activity.create({
      data: {
        userId,
        type,
        targetType,
        targetId,
        metadata,
      },
    });
  }

  async getUserActivity(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activity.count({ where: { userId } }),
    ]);

    return {
      activities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFeedActivity(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Get users this user follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    // Include own activity too
    followingIds.push(userId);

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where: {
          userId: { in: followingIds },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activity.count({
        where: { userId: { in: followingIds } },
      }),
    ]);

    // Get user details
    const userIds = [...new Set(activities.map(a => a.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const activitiesWithUsers = activities.map(a => ({
      ...a,
      user: userMap.get(a.userId),
    }));

    return {
      activities: activitiesWithUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
