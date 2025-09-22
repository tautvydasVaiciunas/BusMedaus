import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import type { App, Credential } from 'firebase-admin/app';
import type { Messaging } from 'firebase-admin/messaging';
import { FIREBASE_MESSAGING } from './notifications.constants';

jest.mock('firebase-admin/app', () => ({
  __esModule: true,
  cert: jest.fn(),
  getApps: jest.fn(),
  initializeApp: jest.fn()
}));

jest.mock('firebase-admin/messaging', () => ({
  __esModule: true,
  getMessaging: jest.fn()
}));

describe('firebase messaging provider', () => {
  const originalEnv = process.env;
  let mockApp: jest.Mocked<typeof import('firebase-admin/app')>;
  let mockMessaging: jest.Mocked<typeof import('firebase-admin/messaging')>;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    mockApp = jest.requireMock('firebase-admin/app') as jest.Mocked<
      typeof import('firebase-admin/app')
    >;
    mockMessaging = jest.requireMock('firebase-admin/messaging') as jest.Mocked<
      typeof import('firebase-admin/messaging')
    >;
    jest.clearAllMocks();

    mockApp.cert.mockReturnValue('mock-cert' as unknown as Credential);
    mockApp.getApps.mockReturnValue([]);
    mockApp.initializeApp.mockImplementation(
      (_config, name?: string) => ({ name } as unknown as App)
    );
    mockMessaging.getMessaging.mockReturnValue('mock-messaging' as unknown as Messaging);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('sanitizes newline escapes before Firebase initialization', async () => {
    process.env.FIREBASE_PROJECT_ID = 'project-id';
    process.env.FIREBASE_CLIENT_EMAIL = 'client@example.com';
    process.env.FIREBASE_PRIVATE_KEY = 'line-one\\nline-two';

    const { NotificationsModule } = await import('./notifications.module');
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      NotificationsModule
    ) as Array<{ provide: unknown; useFactory: () => unknown }>;

    const firebaseMessagingProvider = providers.find(
      (provider) => provider.provide === FIREBASE_MESSAGING
    );

    expect(firebaseMessagingProvider).toBeDefined();

    const messaging = firebaseMessagingProvider!.useFactory();

    expect(messaging).toBe('mock-messaging');
    expect(mockApp.cert).toHaveBeenCalledTimes(1);

    const [credentials] = mockApp.cert.mock.calls[0] as [{ privateKey: string }];
    expect(credentials.privateKey).toContain('\n');
    expect(credentials.privateKey).not.toContain('\\n');
  });
});
