import { Message } from "discord.js";
import { client } from "..";
import { debtRole, funnyMuteRole } from "./config";

export const scheduledEvents: Map<string, (userID: string, guildID: string) => Promise<string>> = new Map<string, (userID: string, guildID: string) => Promise<string>>([

    ["funnyMute", async (userID: string, guildID: string): Promise<string> => {
        let member;
        try {
            const guild = client.guilds.cache.get(guildID);
            member = guild?.members.cache.get(userID);
        } catch (e){return "Failed to get information about this event";}

        // If the role was removed manually then we don't need to do anything nor do we need to throw an error
        if(member?.roles.cache.get(funnyMuteRole) !== undefined) {
            await member?.roles.remove(funnyMuteRole);
            await member.send("Your mute that a paying customer imposed on you in the Octo GAMING Discord server has expired.").catch();
        }
        return "";
    }],

    ["debt", async (userID: string, guildID: string): Promise<string> => {
        let member;
        try {
            const guild = client.guilds.cache.get(guildID);
            member = guild?.members.cache.get(userID);
        } catch (e){return "Failed to get information about this event";}

        // If the role was removed manually then we don't need to do anything nor do we need to throw an error
        if(member?.roles.cache.get(debtRole) !== undefined) {
            await member?.roles.remove(debtRole);
            await member.send("Your mute that was imposed on you due to your debt has expired. You no longer owe the Famous Youtuber Octo any money.").catch();
        }
        return "";
    }], 
    
    ["trapCardCooldown", async (userID: string, guildID: string): Promise<string> => {
        let member;
        try {
            const guild = client.guilds.cache.get(guildID);
            member = guild?.members.cache.get(userID);
        } catch (e){return "Failed to get information about this event";}

        member?.send("Your cooldown on Trap Cards has expired.").catch();
        return "";
    }]


]);