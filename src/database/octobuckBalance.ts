import { IntegerType } from "@frasermcc/overcord";
import { UV_FS_O_FILEMAP } from "constants";
import { User } from "discord.js";
import mongoose from "mongoose";
import assert from "node:assert";
import { logUserTransaction, logBalanceChange, logBalanceSet } from "../utilities/log";
const Schema = mongoose.Schema;

// Octobuck Balance Schema

export interface Balance {
    user: string,
    balance: number
}

const octobuckBalanceSchema = new Schema({
    user: {type: String, required: true, _id: true},
    balance: {type: Number, required: true}
}, {
    timestamps: {},
    collection: "OctobuckBalance"
});

const octobuckBalance: mongoose.Model<Balance> = mongoose.model("OctobuckBalance", octobuckBalanceSchema, "OctobuckBalance");

export {octobuckBalance};

export async function registerBalance(user: User, initialBalance = 0): Promise<string> {

    if(user.bot) {
        return "Failed to register balance: User is a bot";
    } else if(await getUserBalance(user) !== null) {
        return "Failed to register balance: Balance already exists for this user";
    } else if(initialBalance < 0) {
        return "Failed to register balance: cannot specify negative initial balance";
    }

    const newBalance = {
        user: user.id,
        balance: initialBalance ?? 0
    };
    
    // QUERY: Is this needed?
    if(await (await octobuckBalance.find({user: user.id})).length >= 1) {
        return "Failed to register balance: Balance already exists for this user";
    }

    const dbNewBalance = new octobuckBalance(newBalance);
    await dbNewBalance.save();
    return "";
}

export async function getUserBalance(user: User): Promise<number | null> {
    try {
        const balance: Balance | null = await octobuckBalance.findOne({user: user.id});
        return balance?.balance ?? null;
    } catch {
        return null;
    }
}

// Returns true if successful
export async function addBalance(user: User, amount: number): Promise<string> {
    
    if(amount < 0) {
        return "Cannot grant a negative amount of Octobucks";
    }

    let oldBalance: number;
    oldBalance = await getUserBalance(user) ?? -1;

    // Try to register user, if return error that means that user isnt in the server.
    if(oldBalance === -1) {
        const result: string = await registerBalance(user, 0);
        if(result !== "") {
            return result;
        }
    }
    oldBalance = Math.max(oldBalance, 0);
    const newBalance = oldBalance + amount;

    const balance: Balance = {
        user: user.id,
        balance: newBalance
    };

    (await octobuckBalance.findOneAndUpdate({user: user.id}, balance))?.save();
    await logBalanceChange(user, amount, oldBalance, newBalance);
    return "";
}

export async function subtractBalance(user: User, amount: number): Promise<boolean> {
    if(amount < 0) {
        return false;
    }

    let oldBalance: number;
    oldBalance = await getUserBalance(user) ?? -1;

    oldBalance = Math.max(oldBalance, 0);
    const newBalance = oldBalance - amount;

    if(oldBalance === -1 || newBalance < 0) {
        return false;
    }

    const balance = {
        user: user.id,
        balance: newBalance
    };

    await octobuckBalance.findOneAndUpdate({user: user.id}, balance);
    await logBalanceChange(user, -amount, oldBalance, newBalance);
    return true;
}

export async function setBalance(user: User, amount: number): Promise<string> {

    if(amount < 0) {
        return "Cannot set a balance below 0";
    }

    const oldBalance: number = await getUserBalance(user) ?? -1;
    if(oldBalance === -1 && await registerBalance(user, 0) === undefined) {
        return "Cannot find this user in the server";
    }
    const newBalance = amount;

    const balance: Balance = {
        user: user.id,
        balance: newBalance
    };

    (await octobuckBalance.findOneAndUpdate({user: user.id}, balance))?.save();
    await logBalanceSet(user, newBalance, oldBalance);
    return "";
}

export async function transferFunds(sender: User, recipient: User, amount: number): Promise<string> {
    if(amount < 1) {
        return "You must send at least 1 Octobuck";
    } else if(await getUserBalance(sender) === null) {
        return "You don't have a balance at all, how are you going to transfer funds when you're broke?";
    } else if(sender.id === recipient.id) {
        return "You cannot send Octobucks to yourself";
    } else if(recipient.bot) {
        return "You cannot send Octobucks to a bot";
    }else if((await getUserBalance(sender) ?? -1) < amount) {
        return "You have insufficient funds to transfer this amount of money";
    }
    // At this point we know we can transfer the money.
    if(await getUserBalance(recipient) === null) {
        const regResult: string = await registerBalance(recipient, 0);
        if(regResult !== "") {
            return regResult;
        }
    }
    await addBalance(recipient, amount);
    await subtractBalance(sender, amount);
    await logUserTransaction(sender, recipient, amount);
    return "";
}

export async function getAllBalances(page: number): Promise<Balance[]> {

    const pageLimit = 20;

    const balances: Balance[] = await octobuckBalance.aggregate([{$sort: {balance: -1, _id: 1}}, {$skip: (page-1) * pageLimit}, {$limit: pageLimit}, {$match: {balance: {$gt: 0}}}]);
    if(balances.length === 0) {
        throw new Error("This page does not exist. Max pages: " + (Math.ceil(octobuckBalance.length/pageLimit)));
    }
    return balances;
}