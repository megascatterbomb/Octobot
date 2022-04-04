import { Guild, Message, TextChannel, User } from "discord.js";
import { unwatchFile } from "fs";
import { model, Schema, Model, Types} from "mongoose";
import { client } from "..";
import { logLotteryDraw } from "../utilities/log";
import { shopItems } from "../utilities/shop";
import { allowedChannels, ShopItem } from "../utilities/types";
import { addBalance } from "./octobuckBalance";

// Scheduled Event Schema
interface LotteryTicket {
    user: string,
}

interface Lottery {
    jackpot: number
    date: Date
}

const lotteryTicketSchema = new Schema<LotteryTicket>({
    user: {type: String, _id: true, required: true},
}, {
    timestamps: {},
    collection: "LotteryTickets",
});

const lotterySchema = new Schema<Lottery>({
    jackpot: {type: Number},
    date: {type: Date, required: true}
}, {
    timestamps: {},
    collection: "LotteryTickets",
});

const lotteryTicket: Model<LotteryTicket> = model<LotteryTicket>("LotteryTicket", lotteryTicketSchema, "LotteryTicket");
const lottery: Model<Lottery> = model<Lottery>("Lottery", lotterySchema, "Lottery");

export {lotteryTicket, lottery};

// Prevents ticket purchases while the database is preparing a new lottery.
let acceptingTickets = false;

export async function addTicket(user: User) {
    while(!acceptingTickets) {
        // wait
    }
    await lotteryTicket.create({
        user: user.id
    });
    const jackpot = (await getCurrentLottery()).jackpot;
    await lottery.findOneAndUpdate({}, {jackpot: jackpot+5});
}

export async function getTicket(user: User): Promise<LotteryTicket | undefined> {
    return await lotteryTicket.findOne({user: user.id}).lean() ?? undefined;
}

export async function getLotteryPlayerCount(): Promise<number> {
    return await lotteryTicket.count();
}

export async function getLotteryJackpot(): Promise<number> {
    return (await lottery.findOne({}).lean())?.jackpot ?? 0;
}

export async function getLotteryDrawTime(): Promise<Date> {
    return (await getCurrentLottery()).date;
}

async function refreshLottery(): Promise<Lottery> {
    acceptingTickets = false;
    // Ensure lottery ticket is empty
    await lotteryTicket.find({}).deleteMany({});
    // Ensure lottery is empty
    await lottery.find({}).deleteMany({});
    // Upload new lottery
    const dbLottery = {
        jackpot: 5,
        date: new Date().setUTCHours(24, 0, 0, 0)
    };
    const newLottery = await new lottery(dbLottery).save();
    acceptingTickets = true;
    return newLottery;
}

async function getCurrentLottery(): Promise<Lottery> {
    return await lottery.findOne({}).lean() ?? await refreshLottery();
}

async function drawLottery() {
    const tickets: LotteryTicket[] = await lotteryTicket.find({});
    if(tickets.length === 0) {
        console.log("Lottery Draw: Nobody participated.");
        (client.channels.cache.get(allowedChannels[0]) as TextChannel).send("Lottery Draw: Nobody participated.");
        return;
    }
    const winningTicket = tickets[Math.floor(Math.random() * tickets.length)];
    const jackpot = (await getCurrentLottery()).jackpot;

    const winnerObject: User = await client.users.fetch(winningTicket.user);
    const result = await addBalance(winnerObject, jackpot);
    if(result !== "") {
        throw new Error(result);
    }
    (client.channels.cache.get(allowedChannels[0]) as TextChannel).send("<@" + winnerObject.id + "> won " + jackpot + " Octobucks in today's lottery!");
    console.log("Lottery Draw: " + winnerObject.username + " won $" + jackpot);
    await logLotteryDraw(winnerObject, jackpot);
}

// NEVER call this function outside of /index.ts
export async function lotteryLoop() {
    try {
        if(await getCurrentLottery() === undefined) {
            refreshLottery();
        }
        acceptingTickets = true;
        // eslint-disable-next-line no-constant-condition
        while(true) {
            if((await getCurrentLottery()).date.getTime() <= Date.now()) {
                await drawLottery();
                await refreshLottery();
            }
            await delay((await getCurrentLottery()).date);
        }
    } catch (err) {
        console.log("Lottery Broke: " + err);
        client.users.cache.get("193950601271443456")?.send("Lottery Broke: " + err);
    }
}

function delay(date: Date) {
    const time = date.getTime() - Date.now();
    if(time <= 0) {
        return new Promise(resolve => setTimeout(resolve, 0));
    }
    return new Promise(resolve => setTimeout(resolve, time));
}
