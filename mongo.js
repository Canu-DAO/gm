import { MongoClient } from 'mongodb';
import { keys } from './keys.js';

let col;

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

export async function initUser(guildId, userId, username, ts) {
  const doc = {
    'userId': userId,
    'guildId': guildId,
    'username': username,
    'streak': 0,
    'ts': ts
  };
  col.insertOne(doc);
}

export async function getConfig(guildId) {
   return await col.findOne({'guildId': guildId});
}

export async function getUser(guildId, userId) {
  return await col.findOne({'guildId': guildId, 'userId': userId});
}

export async function getRank(guildId) {
  // const query = {
  //   'guildId': { $eq: guildId}
  // };
  return await col.find({'guildId': guildId}).sort({'streak': -1}).toArray()
}

export async function incrUserStreak(guildId, userId, ts) {
  await col.updateOne(
    {'guildId': guildId, 'userId': userId},
    { $inc: { 'streak': 1 }, $set: { 'ts': ts } });
}

export async function clearUserStreak(guildId, userId, ts) {
  await col.updateOne(
    {'guildId': guildId, 'userId': userId},
    { $set: 
      { 'streak': 0, 'ts': ts }
    });
}

mongoConnect().then(()=>{
  //insertGuild('1234567','jiggly','gm','3568357','gm');
  //initUser('9767865', '1972643786', 'jigglyjams#5647', '1635454667676');
  // getUser('1234567','45738475834').then( (x) => {
  //   console.log(x);
  // });
  // incrUserStreak('1234567','45738475834', "567").then( (x) => {
  //   getUser('1234567','45738475834').then( (x) => {
  //     console.log(x)
  //     clearUserStreak('1234567','45738475834', "1234").then( (x) => {
  //       getUser('1234567','45738475834').then( (x) => {
  //         console.log(x);
  //       });
  //     });
  //   });
  // });
  getRank("1234567").then((x)=>{
    console.log(x);
  });
});
