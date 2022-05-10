import { Channel, Client, Guild, GuildChannel, TextChannel, User } from "discord.js";
import { client } from "..";
import { getDiscordName, getDiscordNameFromID } from "./helpers";
import { shopItems } from "./shop";
import { logChannel } from "./config";

export async function logUserTransaction(sender: User | null, receiver: User, amount: number): Promise<void> {
    const senderString: string = sender !== null ? "`" + await getDiscordNameFromID(sender.id, client) + "`" : "The Gamer Gods";
    const receiverString: string =  "`" + await getDiscordNameFromID(receiver.id, client) + "`";

    getLoggingChannel().send({content: "User Transaction: " + senderString + 
            " sent " + receiverString + " $" + amount, allowedMentions: {roles: [], users: []}});
}

export async function logShopTransaction(customer: User, shopItemIndex: number, pricePaid: number): Promise<void> {
    const customerString: string = "`" + await getDiscordNameFromID(customer.id, client) + "`";

    getLoggingChannel().send({content: "Shop Transaction: " + customerString + 
            " bought " + Array.from(shopItems.values())[shopItemIndex-1].name + " for $" + pricePaid, allowedMentions: {roles: [], users: []}});
}

export async function logRandomDropClaim(user: User, amountFound: number, counter: number, antiFraud: boolean): Promise<void> {
    const messageContent: string ="Found Octobuck: `" + await getDiscordNameFromID(user.id, client) + "` found $" + amountFound + " (Message Count: " + counter 
        + (antiFraud ? ", Anti Fraud measures kicked in, subtracted Octobucks)" : ")");

    getLoggingChannel().send({content: messageContent, allowedMentions: {roles: [], users: []}});
}

export async function logLotteryDraw(user: User, amount: number) {
    const messageContent: string ="Lottery Draw: `" + await getDiscordNameFromID(user.id, client) + "` won $" + amount;

    getLoggingChannel().send({content: messageContent, allowedMentions: {roles: [], users: []}});
}

export async function logBalanceChange(user: User, amount: number, oldBalance?: number | undefined, newBalance?: number | undefined): Promise<void> {
    const detailed: boolean = oldBalance !== undefined && newBalance !== undefined && amount === newBalance - oldBalance;
    const amountString: string = amount < 0 ? "-$" + Math.abs(amount) : "$" + Math.abs(amount);

    const messageContent: string ="Balance Change: `" + await getDiscordNameFromID(user.id, client) + "` balance changed by " + amountString + (detailed ? " (" + oldBalance + " -> " + newBalance + ")" : "");
 
    getLoggingChannel().send({content: messageContent, allowedMentions: {roles: [], users: []}});
}

export async function logBalanceSet(user: User, newBalance: number, oldBalance: number): Promise<void> {
    const amount: number = newBalance - oldBalance;
    await logBalanceChange(user, amount, oldBalance, newBalance);

    const messageContent: string ="Balance Set By Gamer God: `" + await getDiscordNameFromID(user.id, client) + "` balance set to " + newBalance;

    getLoggingChannel().send({content: messageContent, allowedMentions: {roles: [], users: []}});
}

function getLoggingChannel() {
    return process.env.ENVIRONMENT === "PRODUCTION" ? client.channels.cache.get(logChannel) as TextChannel: client.channels.cache.get("574157660488859670") as TextChannel;
}