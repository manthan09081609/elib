import dotenv from "dotenv";

dotenv.config();

const _config = {
  port: process.env.PORT,
  databaseUrl: process.env.MONGO_CONNECTION_STRING,
  env: process.env.NODE_ENV,
};

export const config = Object.freeze(_config);
