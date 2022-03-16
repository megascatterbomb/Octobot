import { IntegerType } from "@frasermcc/overcord";
import mongoose from "mongoose";
import { number } from "zod";
const Schema = mongoose.Schema;

// Octobuck Balance Schema

const octobuckBalanceSchema = new Schema({
    user: {type: String, required: true},
    balance: {type: number, required: true}
});

const octobuckBalance = mongoose.model('OctobuckBalance', octobuckBalanceSchema);

export {octobuckBalance};

export async function registerBalance(user: string, initialBalance?: bigint) {
    const newBalance = {
        user: user,
        balance: initialBalance
    };
    
    // Prevent duplicates
    if(await (await octobuckBalance.find({user: user})).length >= 1) {
        return false;
    }

    const dbNewBalance = new octobuckBalance(newBalance);
    await dbNewBalance.save();
    return dbNewBalance;
}

export async function getUserBalance(user: string) {
    const balanceEntry = await octobuckBalance.findOne({user: user});
    return balanceEntry;
}