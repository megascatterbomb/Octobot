import { MongoClient } from "mongodb";
import mongoose from "mongoose";


export default async function connectToDatabase(connectionString ?: string) {

    const prod: boolean = process.env.ENVIRONMENT === "PRODUCTION";

    connectionString = connectionString ?? (prod ? process.env.MONGO_CONN_STRING_PRODUCTION : process.env.MONGO_CONN_STRING_BETA) ?? "";
    await mongoose.connect(connectionString);
}
