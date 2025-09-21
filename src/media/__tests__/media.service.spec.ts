import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { Hive } from '../../hives/hive.entity';
import { User } from '../../users/user.entity';
import { MediaItem } from '../media-item.entity';
import { MediaService } from '../media.service';

describe('MediaService - ensureMediaManageAccess', () => {
  let service: MediaService;

  const createUserEntity = (id: string): User => ({
    id
  } as User);

  const createUserContext = (overrides?: Partial<AuthenticatedUser>): AuthenticatedUser => ({
    userId: 'user-0',
    email: 'user@example.com',
    roles: [],
    ...overrides
  });

  const createMediaItem = (overrides?: Partial<MediaItem>): MediaItem => ({
    id: 'media-1',
    url: 'https://example.com/photo.jpg',
    mimeType: 'image/jpeg',
    hive: {
      id: 'hive-1',
      owner: createUserEntity('owner-1'),
      members: [createUserEntity('member-1')]
    } as Hive,
    uploader: createUserEntity('uploader-1'),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  const invoke = (user: AuthenticatedUser): (() => void) => {
    const media = createMediaItem();
    return () => (service as unknown as { ensureMediaManageAccess: Function }).ensureMediaManageAccess(user, media);
  };

  beforeEach(() => {
    service = new MediaService({} as any, {} as any, {} as any, {} as any, {} as any);
  });

  it.each<[
    string,
    AuthenticatedUser
  ]>([
    [
      'the uploader',
      createUserContext({
        userId: 'uploader-1'
      })
    ],
    [
      'a manager',
      createUserContext({
        userId: 'manager-1',
        roles: ['manager']
      })
    ],
    [
      'the hive owner',
      createUserContext({
        userId: 'owner-1'
      })
    ],
    [
      'a hive member',
      createUserContext({
        userId: 'member-1'
      })
    ]
  ])('allows %s to manage media items', (_description, user) => {
    expect(invoke(user)).not.toThrow();
  });

  it('rejects non-members without privileged roles', () => {
    const user = createUserContext({
      userId: 'intruder-1'
    });

    expect(invoke(user)).toThrow(ForbiddenException);
  });
});
