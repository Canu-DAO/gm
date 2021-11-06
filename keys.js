import dotenv from 'dotenv';
dotenv.config();

console.log(process.env.NODE_ENV);

export const keys = {
  DISCORD_KEY: process.env.NODE_ENV === 'dev' ? process.env.DISCORD_KEY_DEV : process.env.DISCORD_KEY,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  MONGO_USER_PASSWORD: process.env.MONGO_USER_PASSWORD,
};