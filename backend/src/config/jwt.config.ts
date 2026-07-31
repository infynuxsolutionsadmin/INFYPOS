import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'infypos-super-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
}));
