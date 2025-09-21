import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './comment.entity';
import { MessagingService } from './messaging.service';

interface CommentResponse {
  id: string;
  content: string;
  author: { id: string; email: string; roles: string[] };
  createdAt: Date;
}

function mapComment(comment: Comment): CommentResponse {
  return {
    id: comment.id,
    content: comment.content,
    author: {
      id: comment.author.id,
      email: comment.author.email,
      roles: comment.author.roles
    },
    createdAt: comment.createdAt
  };
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('tasks/:taskId/comments')
  async listComments(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string
  ): Promise<CommentResponse[]> {
    const comments = await this.messagingService.getCommentsForTask(user, taskId);
    return comments.map(mapComment);
  }

  @Post('tasks/:taskId/comments')
  async createComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto
  ): Promise<CommentResponse> {
    const comment = await this.messagingService.addComment(user, taskId, dto);
    return mapComment(comment);
  }
}
