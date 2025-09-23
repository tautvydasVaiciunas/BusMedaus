import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './comment.entity';
import { MessagingService } from './messaging.service';
import { formatUserDisplayName } from '../tasks/task.presenter';

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

interface MessageFeedResponse {
  id: string;
  task: { id: string; title: string; hiveId: string; hiveName: string };
  author: {
    id: string;
    email: string;
    roles: string[];
    firstName?: string;
    lastName?: string;
    displayName: string;
  };
  content: string;
  createdAt: string;
  isOwn: boolean;
}

function mapMessage(comment: Comment, currentUserId: string): MessageFeedResponse {
  const task = comment.task!;
  const hive = task.hive!;
  const author = comment.author;
  return {
    id: comment.id,
    task: { id: task.id, title: task.title, hiveId: hive.id, hiveName: hive.name },
    author: {
      id: author.id,
      email: author.email,
      roles: author.roles,
      firstName: author.firstName,
      lastName: author.lastName,
      displayName: formatUserDisplayName(author)
    },
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    isOwn: author.id === currentUserId
  };
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('messages')
  async listMessages(@CurrentUser() user: AuthenticatedUser): Promise<MessageFeedResponse[]> {
    const comments = await this.messagingService.listRecentMessages(user);
    return comments.map((comment) => mapMessage(comment, user.userId));
  }

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
