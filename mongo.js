import { MongoClient } from 'mongodb';
import { keys } from './keys.js';

let col;
let client;

export async function mongoConnect() {
  const uri = `mongodb+srv://jeffrey:${keys.MONGO_USER_PASSWORD}@cluster0.t5lmk.mongodb.net/?retryWrites=true&w=majority`;
  client = new MongoClient(uri);
  try{ 
    await client.connect();
  } catch (e) {
    console.log('ERROR: failed to connect to db');
  }
}

export async function insertGuild(guildName, channelName, channelId, keyword) {
  const doc = {
    'guildName': guildName,
    'channelName': channelName,
    'channelId': channelId,
    'keyword': keyword
  };
  col.insertOne(doc);
}

export async function initUser(userId, username) {
  const doc = {
    'userId': userId,
    'username': username,
    'streak': 0,
    'ts': 0,
    history: []
  };
  col.insertOne(doc);
  return 1;
}

export async function getConfig(guildId) {
  process.env.NODE_ENV === 'dev' ? guildId = guildId + '-dev' : null;
  col = client.db('gm').collection(`${guildId}`);
  return await col.findOne({'channelId': { $exists: true }});
}

export async function getUser(userId) {
  return await col.findOne({'userId': userId});
}

export async function getRank(cutoff) {
  return await col.find({'userId': { $exists: true }, 'username': { $exists: true }, 'ts': { $gt: cutoff} }).project(
    {'_id':0, 'streak':1, 'username': 1}).sort({'streak': -1}).toArray()
}

export async function incrUserStreak(userId, ts) {
  await col.updateOne(
    {'userId': userId},
    { $inc: { 'streak': 1 },
    $set: { 'ts': ts },
    $push: { 'history': ts }}).then( (r) => {
      return (r.ackowledged === true) ? 1 : -1;
    });
}

export async function clearUserStreak(userId) {
  await col.updateOne(
    {'userId': userId},
    { $set: 
      { 'streak': 0 }
    });
}
