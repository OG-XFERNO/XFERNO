import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ========== USER PROFILES ==========

  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.socialService.getUserProfile(userId);
  }

  @Get('profile/username/:username')
  async getProfileByUsername(@Param('username') username: string) {
    return this.socialService.getUserByUsername(username);
  }

  // ========== FOLLOWS ==========

  @Post('follow/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async followUser(@Request() req: any, @Param('userId') userId: string) {
    return this.socialService.followUser(req.user.id, userId);
  }

  @Delete('follow/:userId')
  @UseGuards(JwtAuthGuard)
  async unfollowUser(@Request() req: any, @Param('userId') userId: string) {
    return this.socialService.unfollowUser(req.user.id, userId);
  }

  @Get('followers/:userId')
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFollowers(
      userId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('following/:userId')
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFollowing(
      userId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('is-following/:userId')
  @UseGuards(JwtAuthGuard)
  async isFollowing(@Request() req: any, @Param('userId') userId: string) {
    const isFollowing = await this.socialService.isFollowing(req.user.id, userId);
    return { isFollowing };
  }

  // ========== TOKEN FOLLOWS ==========

  @Post('token/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async followToken(
    @Request() req: any,
    @Body() body: { tokenAddress: string; chainId: number },
  ) {
    return this.socialService.followToken(req.user.id, body.tokenAddress, body.chainId);
  }

  @Delete('token/follow/:tokenAddress')
  @UseGuards(JwtAuthGuard)
  async unfollowToken(
    @Request() req: any,
    @Param('tokenAddress') tokenAddress: string,
    @Query('chainId') chainId: string,
  ) {
    return this.socialService.unfollowToken(
      req.user.id,
      tokenAddress,
      parseInt(chainId || '11155111'),
    );
  }

  @Get('token/following')
  @UseGuards(JwtAuthGuard)
  async getFollowedTokens(
    @Request() req: any,
    @Query('chainId') chainId: string,
  ) {
    return this.socialService.getFollowedTokens(
      req.user.id,
      parseInt(chainId || '11155111'),
    );
  }

  @Get('token/is-following/:tokenAddress')
  @UseGuards(JwtAuthGuard)
  async isFollowingToken(
    @Request() req: any,
    @Param('tokenAddress') tokenAddress: string,
    @Query('chainId') chainId: string,
  ) {
    const isFollowing = await this.socialService.isFollowingToken(
      req.user.id,
      tokenAddress,
      parseInt(chainId || '11155111'),
    );
    return { isFollowing };
  }

  // ========== COMMENTS ==========

  @Post('comments')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Request() req: any,
    @Body() body: { tokenAddress: string; chainId: number; content: string; parentId?: string },
  ) {
    return this.socialService.createComment(
      req.user.id,
      body.tokenAddress,
      body.chainId,
      body.content,
      body.parentId,
    );
  }

  @Put('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Request() req: any,
    @Param('commentId') commentId: string,
    @Body() body: { content: string },
  ) {
    return this.socialService.updateComment(req.user.id, commentId, body.content);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  async deleteComment(@Request() req: any, @Param('commentId') commentId: string) {
    return this.socialService.deleteComment(req.user.id, commentId);
  }

  @Get('comments/:tokenAddress')
  async getComments(
    @Param('tokenAddress') tokenAddress: string,
    @Query('chainId') chainId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getComments(
      tokenAddress,
      parseInt(chainId || '11155111'),
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('comments/:commentId/replies')
  async getReplies(
    @Param('commentId') commentId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getReplies(
      commentId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  // ========== COMMENT LIKES ==========

  @Post('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async likeComment(@Request() req: any, @Param('commentId') commentId: string) {
    return this.socialService.likeComment(req.user.id, commentId);
  }

  @Delete('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  async unlikeComment(@Request() req: any, @Param('commentId') commentId: string) {
    return this.socialService.unlikeComment(req.user.id, commentId);
  }

  @Get('comments/:commentId/has-liked')
  @UseGuards(JwtAuthGuard)
  async hasLikedComment(@Request() req: any, @Param('commentId') commentId: string) {
    const hasLiked = await this.socialService.hasLikedComment(req.user.id, commentId);
    return { hasLiked };
  }

  // ========== ACTIVITY FEED ==========

  @Get('activity/user/:userId')
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getUserActivity(
      userId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('activity/feed')
  @UseGuards(JwtAuthGuard)
  async getFeedActivity(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFeedActivity(
      req.user.id,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }
}
