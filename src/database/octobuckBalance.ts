import { IntegerType } from "@frasermcc/overcord";
import { User } from "discord.js";
import mongoose from "mongoose";
import assert from "node:assert";
const Schema = mongoose.Schema;

// Octobuck Balance Schema

const octobuckBalanceSchema = new Schema({
    user: {type: String, required: true},
    balance: {type: Number, required: true}
}, {
    timestamps: {},
    collection: "OctobuckBalance"
});

const octobuckBalance = mongoose.model("OctobuckBalance", octobuckBalanceSchema, "OctobuckBalance");

export {octobuckBalance};

export async function registerBalance(user: User, initialBalance: number = 0): Promise<number | undefined> {

    if(user.bot || await getUserBalance(user) !== null || initialBalance < 0) {
        return undefined;
    }

    const newBalance = {
        user: user.id,
        balance: initialBalance ?? 0
    };
    
    // Prevent duplicates
    if(await (await octobuckBalance.find({user: user.id})).length >= 1) {
        return undefined;
    }

    const dbNewBalance = new octobuckBalance(newBalance);
    await dbNewBalance.save();
    return dbNewBalance;
}

export async function getUserBalance(user: User): Promise<number | null> {
    try {
        const {balance: balanceEntry} = await octobuckBalance.findOne({user: user.id});
        return balanceEntry;
    } catch {
        return null;
    }
}

// Returns true if successful
export async function addBalance(user: User, amount: number): Promise<boolean> {
    
    let oldBalance: number;
    oldBalance = await getUserBalance(user) ?? -1;
    if(oldBalance === -1 && await registerBalance(user, 0) === undefined) {
        return false;
    }
    oldBalance = Math.max(oldBalance, 0);
    const newBalance = oldBalance + amount;

    const balance = {
        user: user.id,
        balance: newBalance
    }

    await octobuckBalance.findOneAndUpdate({user: user.id}, balance);

    return true;
}