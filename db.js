/* 
* Store gm's in a simple JSON file
* A JSONdb for each guild is saved in ./db/${guildId}.json
* gm info is keyed by userId
  * name: username#num
  * today: did the user gm today?
  * streak: current streak
*/

import JSONdb from 'simple-json-db';

var db;

export async function loadJSONdb(path, guildName, channelName, channelId, keyword='gm') {
  const options = {
    asyncWrite: false, 
    syncOnWrite: true,
    jsonSpaces: 4 };
  const fullPath = `${process.cwd()}${path}.json`
  const config = {
    'guildName': guildName,
    'channelName': channelName,
    'channelId': channelId,
    'keyword': keyword
  };
  try {
    db = new JSONdb(fullPath, options);
    db.set('config', config);
  } catch(e) {
    console.log(`${new Date().toISOString()}\t${e}`);
  }
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
  data.streak = 0;
  data.ts = 0;
  db.set(id, data)
}

export async function userExist(id) {
  return db.has(id);
}

export async function getUser(id) {
  return db.get(id);
}

export async function getRank() {
  const allData = db.JSON();
  var streaks = [];
  const keys = Object.keys(allData);
  keys.splice(keys.indexOf('config'),1);
  for (let i = 0; i < keys.length; i++) {
    streaks.push([allData[keys[i]].name, allData[keys[i]].streak]);
  }
  return streaks.sort( (a, b) => {  return a[1] < b[1] ? 1 : -1 });
}
