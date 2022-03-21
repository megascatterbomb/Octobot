// Shop items are concretely defined here. Changes require update to the code.

import { Collection, Message, User, Permissions, GuildMember } from "discord.js";
import { client } from "..";
import { createScheduledEvent } from "../database/schedule";
import { getAllRoles, getSpecialRoles } from "./helpers";
import { Roles, ShopItem } from "./types";

export const shopItems: Map<string, ShopItem> = new Map<string, ShopItem>([
    ["nickname", {name: "Nickname Perms", basePrice: 10, roleDiscounts: [{role: Roles.gamerGod, dPrice: 0}, {role: Roles.gamerPolice, dPrice: 0}, 
        {role: Roles.memeMachine, dPrice: 0}, {role: Roles.famousArtist, dPrice: 0}, {role: Roles.ggsVeteran, dPrice: 0}, {role: Roles.gigaGamer, dPrice: 0}], 
    effect: async (message: Message): Promise<boolean> => {
        if((await getSpecialRoles(message.author, message.guild)).entries.length !== 0 || message.member?.permissions.has(Permissions.FLAGS.CHANGE_NICKNAME)) {
            await message.channel.send("One or more of your roles lets you change your nickname for free! Right click your avatar -> Edit server profile");
            return false;
        }
        await message.member?.permissions.add(Permissions.FLAGS.CHANGE_NICKNAME);
        await message.channel.send("You have five minutes to change your nickname to whatever you want! Right click your avatar -> Edit server profile")
        const endDate = new Date(Date.now() + 5*60000); // five minutes from execution
        const result: boolean = await createScheduledEvent("nickname", message.author.id, message.guild?.id, endDate);
        return result;
    }, scheduledEvent: async (userID: string, guildID: string): Promise<boolean> => {
        try {
            let guild = client.guilds.cache.get(guildID);
            let member = guild?.members.cache.get(userID);
            await member?.permissions.remove(Permissions.FLAGS.CHANGE_NICKNAME);
        } catch {
            return false;
        }
        return true;
    },
    description: "Gives you permission to change your nickname for 5 minutes. Once that time's up you're stuck with whatever you chose!"
    }],
]);


export default async function getShopEmbed() {

}