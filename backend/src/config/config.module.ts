import { resolve } from 'node:path';
import { ConfigModule } from '@nestjs/config';
import { validateBackendEnvironment } from './configuration';

const workingDirectory = process.cwd();

export const AppConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [
    resolve(workingDirectory, '.env'),
    resolve(workingDirectory, '..', '.env'),
    resolve(workingDirectory, '.env.example'),
    resolve(workingDirectory, '..', '.env.example'),
  ],
  validate: validateBackendEnvironment,
});
