import { MongoClient } from 'mongodb';
import { keys } from './keys.js';
import JSONdb from 'simple-json-db';

const file = process.argv[2];
const guildId = process.argv[3];

let col;
let dbdb;

async function mongoConnect() {
  const uri = `mongodb+srv://jeffrey:${keys.MONGO_USER_PASSWORD}@cluster0.t5lmk.mongodb.net/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);
  try{ 
    await client.connect();
    col = client.db('gm').collection('streaks');
  } catch (e) {
    console.log('ERROR: failed to connect to db');
  }
}

async function insertUser(guildId, userId, username, streak ,ts) {
    const doc = {
      'guildId': guildId,
      'userId': userId,
      'username': username,
      'streak': streak,
      'ts': ts
    };
    col.insertOne(doc);
    return 1;
}

const options = {
    asyncWrite: false, 
    syncOnWrite: true,
    jsonSpaces: 4 
  };
dbdb = new JSONdb(file, options);

mongoConnect().then( () => {
    const allData = dbdb.JSON();
    console.log(allData);
    const key = Object.keys(allData);
    key.splice(key.indexOf('config'),1);
    for (var i = 0; i < key.length; i++) {
        const user = dbdb.get(key[i])
        const username = user.name;
        const streak = user.streak;
        const ts = user.ts;
        insertUser(guildId, key[i], username, streak, ts);
    }
});


