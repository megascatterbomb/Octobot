import mongoose from 'mongoose';

const user: string = "mega";
const pw: string = process.env.MONGO_PASSWORD ?? "invalid";

const DEFAULT_CONNECTION_STRING: string = "mongodb+srv://" + user +":" + pw + "@<your-cluster-url>/sample_airbnb?retryWrites=true&w=majority";

export default function connectToDatabase(connectionString = DEFAULT_CONNECTION_STRING) {
    return mongoose.connect(connectionString);
}
