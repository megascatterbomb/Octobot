import { IntegerType } from "@frasermcc/overcord";
import { User } from "discord.js";
import mongoose from "mongoose";
import assert from "node:assert";
const Schema = mongoose.Schema;

// Octobuck Balance Schema

interface Balance {
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

const octobuckBalance = mongoose.model("OctobuckBalance", octobuckBalanceSchema, "OctobuckBalance");

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
        const {balance: balanceEntry} = await octobuckBalance.findOne({user: user.id});
        return balanceEntry;
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

    return "";
}

export async function transferFunds(sender: User, recipient: User, amount: number): Promise<string> {
    if(amount < 1) {
        return "You must send at least 1 Octobuck";
    } else if(await getUserBalance(sender) === null) {
        return "You don't have a balance at all, how are you going to transfer funds when you're broke?";
    } else if(await getUserBalance(sender) ?? -1 < amount) {
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
    return "";
}