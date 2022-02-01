import { MongoClient } from 'mongodb';
import { keys } from './keys.js';

let col;
let client;

export async function mongoConnect() {
  const uri = `mongodb+srv://jeffrey:${keys.MONGO_USER_PASSWORD}@cluster0.t5lmk.mongodb.net/?retryWrites=true&w=majority`;
  client = new MongoClient(uri);
  try { 
    await client.connect();
    return 1;
  } catch (e) {
    await client.close();
    return -1;
  }
}

export async function insertGuild(guildName, channelName, channelId, keyword) {
  const doc = {
    'guildName': guildName,
    'channelName': channelName,
    'channelId': channelId,
    'keyword': keyword
  };
  await col.insertOne(doc);
}

export async function initUser(userId, username, ts) {
  const doc = {
    'userId': userId,
    'username': username,
    'streak': 1,
    'ts': ts,
    history: [ts]
  };
  await col.insertOne(doc);
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

export async function getTotalRank() {
  const history =  await col.find({'history': { $exists: true }}, { projection: { _id: 0, 'history':1, 'username': 1 }}).toArray()
  var countedHistory = [];
  history.forEach( h => {
    countedHistory.push({ username:h.username, historyCount: h.history.length })
  })
  return countedHistory.sort((a,b) => { return b.historyCount - a.historyCount});
}

export async function incrUserStreak(userId, ts) {
  const options = { returnNewDocument: true, returnDocument: 'after' };
  return await col.findOneAndUpdate(
    {'userId': userId},
    { $inc: { 'streak': 1 },
    $set: { 'ts': ts },
    $push: { 'history': ts }},
    options).then( (r) => {
      return r.value;
    });
}

export async function clearUserStreak(userId, ts) {
  await col.updateOne(
    {'userId': userId},
    { $set: 
      { 'streak': 1, 'ts': ts },
      $push: { 'history': ts }
    });
}

export async function zeroUserStreak(userId) {
  await col.updateOne(
    {'userId': userId},
    { $set: 
      { 'streak': 0 }
    });
}
