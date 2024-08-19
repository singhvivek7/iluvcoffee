import * as Joi from '@hapi/joi';

export default Joi.object({
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5433),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
});
