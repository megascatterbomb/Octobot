import mongoose from 'mongoose';



export default async function connectToDatabase(connectionString ?: string) {
    const user: string = "mega";
    const pw: string = process.env.MONGO_PASSWORD ?? "invalid";

    connectionString = connectionString ?? "mongodb+srv://" + user +":" + pw + "@octodb.imnew.mongodb.net/OctoDB?retryWrites=true&w=majority";
    return await mongoose.connect(connectionString);
}
