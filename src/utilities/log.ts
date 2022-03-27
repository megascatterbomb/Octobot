import { Channel, Client, Guild, GuildChannel, TextChannel, User } from "discord.js";
import { client } from "..";
import { getDiscordName } from "./helpers";
import { shopItems } from "./shop";
import { logChannel } from "./types";

export async function logUserTransaction(sender: User | null, receiver: User, amount: number): Promise<void> {
    const senderString: string = sender !== null ? "<@" + sender.id + ">" : "The Gamer Gods";
    const receiverString: string =  "<@" + receiver.id + ">";

    (client.channels.cache.get(logChannel) as TextChannel).send({content: "User Transaction: " + senderString + 
            " sent " + receiverString + " $" + amount, allowedMentions: {roles: [], users: []}});
}

export async function logShopTransaction(customer: User, shopItemIndex: number, pricePaid: number): Promise<void> {
    const customerString: string = "<@" + customer.id + ">";

    (client.channels.cache.get(logChannel) as TextChannel).send({content: "Shop Transaction: " + customerString + 
            " bought " + Array.from(shopItems.values())[shopItemIndex-1].name + " for $" + pricePaid, allowedMentions: {roles: [], users: []}});
}

export async function logBalanceChange(user: User, amount: number, oldBalance?: number | undefined, newBalance?: number | undefined): Promise<void> {
    const detailed: boolean = oldBalance !== undefined && newBalance !== undefined && amount === newBalance - oldBalance;
    const amountString: string = amount < 0 ? "-$" + Math.abs(amount) : "$" + Math.abs(amount);

    const messageContent: string ="Balance Change: <@" + user.id + "> changed by " + amountString + (detailed ? " (" + oldBalance + " -> " + newBalance + ")" : "");
 
    (client.channels.cache.get(logChannel) as TextChannel).send({content: messageContent, allowedMentions: {roles: [], users: []}});
}