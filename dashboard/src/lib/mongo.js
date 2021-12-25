import { MongoClient } from 'mongodb';

let client;

export async function mongoConnect() {
  const uri = process.env.MONGODB_URI;
  client = new MongoClient(uri);
  try { 
    const returnClient = await client.connect();
    return returnClient;
  } catch (e) {
    console.log(e);
    await client.close();
    return -1;
  }
}
