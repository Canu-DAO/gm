/* 
* Store gm's in a simple JSON file
* A JSONdb for each guild is saved in ./db/${guildId}.json
* gm info is keyed by userId
  * name: username#num
  * ts: last gm timestamp (that was incremented)
  * streak: current streak
*/

import JSONdb from 'simple-json-db';

var db;

export async function loadJSONdb(path, guildName, channelName, channelId) {
  const options = {
    asyncWrite: true, 
    syncOnWrite: true,
    jsonSpaces: 4 };
  const fullPath = `${process.cwd()}${path}.json`
  const config = {
    'guildName': guildName,
    'channelName': channelName,
    'channelId': channelId
  };
  try {
    db = new JSONdb(fullPath, options);
    db.set('config', config)
  } catch(e) {
    console.log('Error creating db!');
  }
}

export async function configJSONdb(channel) {
  db.set('channel', channel);
} 

export async function initUser(id, username, ts) {
  const s = {
    'name': username,
    'ts': ts,
    'streak': 1
  }
  db.set(id, s);
}

export async function incrUserStreak(id, ts) {
  const data = db.get(id);
  data.streak += 1;
  data.ts = ts;
  db.set(id, data);
}

export async function clearUserStreak(id) {
  const data = db.get(id);
  data.streak = 1;
  db.set(data)
}

export async function userExist(id) {
  return db.has(id);
}

export async function getUser(id) {
  return db.get(id);
}
