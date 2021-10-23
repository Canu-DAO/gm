import { MongoClient } from 'mongodb';
import { keys } from './keys.js';

let col;
let JSONdb;

export async function mongoConnect() {
  const uri = `mongodb+srv://jeffrey:${keys.MONGO_USER_PASSWORD}@cluster0.t5lmk.mongodb.net/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);
  try{ 
    await client.connect();
    col = client.db('gm').collection('streaks');
  } catch (e) {
    console.log('ERROR: failed to connect to db');
  }
}

export async function insertGuild(guildId, guildName, channelName, channelId, keyword) {
  const doc = {
    'guildId': guildId,
    'guildName': guildName,
    'channelName': channelName,
    'channelId': channelId,
    'keyword': keyword
  };
  col.insertOne(doc);
}

export async function initUser(guildId, userId, username) {
  const doc = {
    'guildId': guildId,
    'userId': userId,
    'username': username,
    'streak': 0,
    'ts': 0
  };
  col.insertOne(doc);
  return 1;
}

export async function getConfig(guildId) {
   return await col.findOne({'guildId': guildId, 'guildName': { $exists: true }});
}

export async function getUser(guildId, userId) {
  return await col.findOne({'guildId': guildId, 'userId': userId});
}

export async function getRank(guildId) {
  return await col.find({'guildId': guildId, 'userId': { $exists: true } }).project(
    {'_id':0, 'streak':1, 'username': 1}).sort({'streak': -1}).toArray()
}

export async function incrUserStreak(guildId, userId, ts) {
  await col.updateOne(
    {'guildId': guildId, 'userId': userId},
    { $inc: { 'streak': 1 },
    $set: { 'ts': ts }});
}

export async function clearUserStreak(guildId, userId) {
  await col.updateOne(
    {'guildId': guildId, 'userId': userId},
    { $set: 
      { 'streak': 0 }
    });
}
