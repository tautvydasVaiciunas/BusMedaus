export const config = {
  jwtSecret: process.env.JWT_SECRET || 'development-secret',
  jwtExpiresIn: 15 * 60, // 15 minutes
  refreshTokenTtl: 7 * 24 * 60 * 60, // 7 days
};

export default config;
