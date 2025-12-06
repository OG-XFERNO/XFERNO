'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useUserProfile,
  useIsFollowing,
  useFollowUser,
  useUnfollowUser,
  useUserActivity,
} from '@/lib/api/social';
import {
  User,
  UserPlus,
  UserMinus,
  Calendar,
  Coins,
  Users,
  Activity,
  Loader2,
  Edit2,
} from 'lucide-react';
import Link from 'next/link';

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

function ActivityItem({ activity }: { activity: any }) {
  const getActivityText = () => {
    switch (activity.type) {
      case 'TRADE':
        return 'Made a trade';
      case 'COMMENT':
        return 'Left a comment';
      case 'FOLLOW':
        return 'Followed a user';
      case 'TOKEN_FOLLOW':
        return 'Started watching a token';
      case 'TOKEN_LAUNCH':
        return 'Launched a token';
      default:
        return 'Activity';
    }
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="p-2 rounded-full bg-muted">
        <Activity className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm">{getActivityText()}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(activity.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser, isAuthenticated } = useAuth();

  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
  const { data: isFollowing, isLoading: followLoading } = useIsFollowing(userId);
  const { data: activities, isLoading: activitiesLoading } = useUserActivity(userId);

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const isOwnProfile = currentUser?.id === userId;
  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

  const handleFollow = async () => {
    try {
      await followMutation.mutateAsync(userId);
      toast.success('User followed');
    } catch (error) {
      toast.error('Failed to follow user');
    }
  };

  const handleUnfollow = async () => {
    try {
      await unfollowMutation.mutateAsync(userId);
      toast.success('User unfollowed');
    } catch (error) {
      toast.error('Failed to unfollow user');
    }
  };

  if (profileLoading) {
    return (
      <div className="container py-8 max-w-4xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>
              This user doesn't exist or has been deleted.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const displayName = profile.displayName || profile.username || 'Anonymous';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="container py-8 max-w-4xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24 mx-auto md:mx-0">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl bg-gradient-fire text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                <Badge variant="secondary" className="w-fit mx-auto md:mx-0">
                  {profile.accountType}
                </Badge>
              </div>

              {profile.username && (
                <p className="text-muted-foreground mb-2">@{profile.username}</p>
              )}

              {profile.bio && (
                <p className="text-sm mb-4">{profile.bio}</p>
              )}

              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDate(profile.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  {profile.tokensCreated} tokens
                </div>
              </div>

              <div className="flex justify-center md:justify-start gap-6 mb-4">
                <div className="text-center">
                  <p className="text-xl font-bold">{profile.followersCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{profile.followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center md:justify-start gap-2">
                {isOwnProfile ? (
                  <Link href="/settings">
                    <Button variant="outline">
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  </Link>
                ) : isAuthenticated ? (
                  isFollowing ? (
                    <Button
                      variant="outline"
                      onClick={handleUnfollow}
                      disabled={isFollowLoading}
                    >
                      {isFollowLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="mr-2 h-4 w-4" />
                      )}
                      Unfollow
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                      className="bg-gradient-fire hover:opacity-90"
                    >
                      {isFollowLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      Follow
                    </Button>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="activity">
        <TabsList className="mb-4">
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="tokens">
            <Coins className="mr-2 h-4 w-4" />
            Tokens
          </TabsTrigger>
          <TabsTrigger value="followers">
            <Users className="mr-2 h-4 w-4" />
            Followers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities?.activities && activities.activities.length > 0 ? (
                <div>
                  {activities.activities.map((activity: any) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No activity yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle>Created Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No tokens created yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followers">
          <Card>
            <CardHeader>
              <CardTitle>Followers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No followers yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
