import dotenv from 'dotenv';
dotenv.config();

export const config = {
  keyword: 'gm',
  storagePath:'/db/',
  clearanceTimeH:15,
  DISCORD_KEY: process.env.DISCORD_KEY,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CHANNEL_ID: process.env.DISCORD_CHANNEL_ID,
};