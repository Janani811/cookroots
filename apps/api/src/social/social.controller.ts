import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { CurrentUser } from '../common/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import {
  CommentDto,
  ReactDto,
  RateRecipeDto,
  TriedPostDto,
} from './dto/social.dto';
import { SocialService } from './social.service';

class CommentBodyDto extends CommentDto {
  @IsOptional()
  @IsString()
  text?: string;
}

@Controller('recipes/:recipeId')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('comments')
  @UseGuards(OptionalAuthGuard)
  getComments(
    @Param('recipeId') recipeId: string,
    @CurrentUser() userId?: string,
  ) {
    return this.socialService.getComments(recipeId, userId);
  }

  @Post('like')
  @UseGuards(JwtAuthGuard)
  like(@Param('recipeId') recipeId: string, @CurrentUser() userId: string) {
    return this.socialService.likeRecipe(recipeId, userId);
  }

  @Delete('like')
  @UseGuards(JwtAuthGuard)
  unlike(@Param('recipeId') recipeId: string, @CurrentUser() userId: string) {
    return this.socialService.unlikeRecipe(recipeId, userId);
  }

  @Post('comments')
  @UseGuards(JwtAuthGuard)
  comment(
    @Param('recipeId') recipeId: string,
    @Body() dto: CommentBodyDto,
    @CurrentUser() userId: string,
  ) {
    const content = dto.content || dto.text || '';
    return this.socialService.comment(
      recipeId,
      userId,
      content,
      dto.parentCommentId,
    );
  }

  @Post('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  likeComment(
    @Param('commentId') commentId: string,
    @CurrentUser() userId: string,
  ) {
    return this.socialService.likeComment(commentId, userId);
  }

  @Delete('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  unlikeComment(
    @Param('commentId') commentId: string,
    @CurrentUser() userId: string,
  ) {
    return this.socialService.unlikeComment(commentId, userId);
  }

  @Get('reactions')
  @UseGuards(OptionalAuthGuard)
  getReactions(
    @Param('recipeId') recipeId: string,
    @CurrentUser() userId?: string,
  ) {
    return this.socialService.getReactionsForTarget(
      'recipe_description',
      recipeId,
      userId,
    );
  }

  @Post('reactions')
  @UseGuards(JwtAuthGuard)
  react(
    @Param('recipeId') recipeId: string,
    @Body() dto: ReactDto,
    @CurrentUser() userId: string,
  ) {
    return this.socialService.react(
      dto.targetType,
      dto.targetId,
      userId,
      dto.emoji,
    );
  }

  @Delete('reactions')
  @UseGuards(JwtAuthGuard)
  unreact(
    @Param('recipeId') recipeId: string,
    @Body() dto: ReactDto,
    @CurrentUser() userId: string,
  ) {
    return this.socialService.unreact(
      dto.targetType,
      dto.targetId,
      userId,
      dto.emoji,
    );
  }

  @Post('ratings')
  @UseGuards(JwtAuthGuard)
  rate(
    @Param('recipeId') recipeId: string,
    @Body() dto: RateRecipeDto,
    @CurrentUser() userId: string,
  ) {
    return this.socialService.rate(recipeId, userId, dto.rating);
  }

  @Post('tried')
  @UseGuards(JwtAuthGuard)
  tried(
    @Param('recipeId') recipeId: string,
    @Body() dto: TriedPostDto,
    @CurrentUser() userId: string,
  ) {
    return this.socialService.triedPost(
      recipeId,
      userId,
      dto.imageUrl,
      dto.comment,
      dto.rating,
    );
  }
}
