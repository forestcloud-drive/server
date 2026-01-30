import type { EnvParams } from '@app/shared/enums';
import * as Joi from 'joi';
import { v7 as uuidv7 } from 'uuid';

export class ConfigValidationService {
  public static createSchema(): Joi.ObjectSchema {
    return Joi.object<typeof EnvParams>({
      HOST: Joi.string().hostname().optional().default('localhost'),
      PORT: Joi.number().port().optional().default(9180),

      CLIENT_URL: Joi.string()
        .uri()
        .optional()
        .default('http://localhost:7180'),

      SQLITE_DB: Joi.string().optional().default('.db/forest.sqlite'),

      JWT_SECRET: Joi.string().optional().default(uuidv7()),
      JWT_EXPIRES_IN: Joi.string().optional().default('21d'),

      UPLOADS_DEST: Joi.string().optional().default('./uploads'),
    });
  }
}
