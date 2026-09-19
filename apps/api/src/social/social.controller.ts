import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { AuthGuard, OptionalAuthGuard } from '../auth/auth.guard';
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
    @Req() req: { userId?: string },
  ) {
    return this.socialService.getComments(recipeId, req.userId);
  }

  @Post('like')
  @UseGuards(AuthGuard)
  like(@Param('recipeId') recipeId: string, @Req() req: { userId: string }) {
    return this.socialService.likeRecipe(recipeId, req.userId);
  }

  @Delete('like')
  @UseGuards(AuthGuard)
  unlike(@Param('recipeId') recipeId: string, @Req() req: { userId: string }) {
    return this.socialService.unlikeRecipe(recipeId, req.userId);
  }

  @Post('comments')
  @UseGuards(AuthGuard)
  comment(
    @Param('recipeId') recipeId: string,
    @Body() dto: CommentBodyDto,
    @Req() req: { userId: string },
  ) {
    const content = dto.content || dto.text || '';
    return this.socialService.comment(
      recipeId,
      req.userId,
      content,
      dto.parentCommentId,
    );
  }

  @Post('comments/:commentId/like')
  @UseGuards(AuthGuard)
  likeComment(
    @Param('commentId') commentId: string,
    @Req() req: { userId: string },
  ) {
    return this.socialService.likeComment(commentId, req.userId);
  }

  @Delete('comments/:commentId/like')
  @UseGuards(AuthGuard)
  unlikeComment(
    @Param('commentId') commentId: string,
    @Req() req: { userId: string },
  ) {
    return this.socialService.unlikeComment(commentId, req.userId);
  }

  @Get('reactions')
  @UseGuards(OptionalAuthGuard)
  getReactions(
    @Param('recipeId') recipeId: string,
    @Req() req: { userId?: string },
  ) {
    return this.socialService.getReactionsForTarget(
      'recipe_description',
      recipeId,
      req.userId,
    );
  }

  @Post('reactions')
  @UseGuards(AuthGuard)
  react(
    @Param('recipeId') recipeId: string,
    @Body() dto: ReactDto,
    @Req() req: { userId: string },
  ) {
    return this.socialService.react(
      dto.targetType,
      dto.targetId,
      req.userId,
      dto.emoji,
    );
  }

  @Delete('reactions')
  @UseGuards(AuthGuard)
  unreact(
    @Param('recipeId') recipeId: string,
    @Body() dto: ReactDto,
    @Req() req: { userId: string },
  ) {
    return this.socialService.unreact(
      dto.targetType,
      dto.targetId,
      req.userId,
      dto.emoji,
    );
  }

  @Post('ratings')
  @UseGuards(AuthGuard)
  rate(
    @Param('recipeId') recipeId: string,
    @Body() dto: RateRecipeDto,
    @Req() req: { userId: string },
  ) {
    return this.socialService.rate(recipeId, req.userId, dto.rating);
  }

  @Post('tried')
  @UseGuards(AuthGuard)
  tried(
    @Param('recipeId') recipeId: string,
    @Body() dto: TriedPostDto,
    @Req() req: { userId: string },
  ) {
    return this.socialService.triedPost(
      recipeId,
      req.userId,
      dto.imageUrl,
      dto.comment,
      dto.rating,
    );
  }
}
