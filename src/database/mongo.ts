import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';



export default async function connectToDatabase(connectionString ?: string) {
    const user: string = "mega";
    const pw: string = process.env.MONGO_PASSWORD ?? "invalid";
    const prod: boolean = process.env.ENVIRONMENT === "PRODUCTION";
    const db: string = prod ? "OctoDB" : "OctoDB_beta";

    connectionString = connectionString ?? "mongodb+srv://" + user +":" + pw + "@octodb.imnew.mongodb.net/" + db + "?retryWrites=true&w=majority";
    await mongoose.connect(connectionString);
}
