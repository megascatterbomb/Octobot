// Shop items are concretely defined here. Changes require update to the code.

import { Collection, Message, User, Permissions, GuildMember, Guild } from "discord.js";
import { client } from "..";
import { createScheduledEvent, getScheduledEvent } from "../database/schedule";
import { convertToRolesEnum, getAllRoles, getSpecialRoles } from "./helpers";
import { cringeMuteRole, funnyMuteRole, nickNameRole, Roles, ShopItem } from "./types";

export const shopItems: Map<string, ShopItem> = new Map<string, ShopItem>([
    ["nickname", {name: "Nickname Perms", basePrice: 10, roleDiscounts: [{role: Roles.gamerGod, dPrice: 0}, {role: Roles.gamerPolice, dPrice: 0}, 
        {role: Roles.memeMachine, dPrice: 0}, {role: Roles.famousArtist, dPrice: 0}, {role: Roles.ggsVeteran, dPrice: 0}, {role: Roles.gigaGamer, dPrice: 0}], 
    effect: async (message: Message): Promise<string> => {
        // Deprecated (handled by commands/shop.ts)
        // if((await getSpecialRoles(message.author, message.guild)).entries.length !== 0 || message.member?.permissions.has(Permissions.FLAGS.CHANGE_NICKNAME)) {
        //     await message.channel.send("One or more of your roles lets you change your nickname for free! Right click your avatar -> Edit server profile");
        //     return false;
        // }
        if(message.member?.roles.cache.get(nickNameRole) !== undefined || await getScheduledEvent(message.author, message?.guild, "nickname") !== null) {
            return "You already purchased the ability to change your nickname. Use it!";
        }
        await message.member?.roles.add(nickNameRole);
        await message.channel.send("You have five minutes to change your nickname to whatever you want! Right click your avatar -> Edit server profile")
        const endDate = new Date(Date.now() + 5*60000); // five minutes from execution
        const result: string = await createScheduledEvent("nickname", message.author.id, message.guild?.id, endDate) ? "" : "An error occured scheduling the five minute window";
        return result;
    }, scheduledEvent: async (userID: string, guildID: string): Promise<string> => {
        try {
            var guild = client.guilds.cache.get(guildID);
            var member = guild?.members.cache.get(userID);
        } catch (e){return "Failed to get information about this event"}

        // If the role was removed manually then we don't need to do anything nor do we need to throw an error
        if(member?.roles.cache.get(nickNameRole) !== undefined) {
            await member?.roles.remove(nickNameRole);
        }
        return "";
    },
    requiresTarget: false, 
    description: "Gives you permission to change your nickname for 5 minutes. Once that time's up you're stuck with whatever you chose!"
    }],


    ["muteShort", {name: "Mute Member (short)", basePrice: 25, roleDiscounts: [],
    effect: async (message: Message, target: User): Promise<string> => {
        const targetMember: GuildMember | undefined = message.guild?.members.cache.get(target?.id);
        if(targetMember === undefined) {
            return "Targeted user is not in the server.";
        } else if(targetMember === message.member) {
            return "You cannot target yourself!";
        } else if(targetMember.user.bot) {
            return "You cannot target a bot."
        } else if(targetMember.roles.cache.hasAny(Roles.gamerGod, Roles.gamerPolice)) {
            return "You cannot target Gamer Gods or Gamer Police.";
        } else if(targetMember?.roles.cache.get(cringeMuteRole) !== undefined) {
            return "This user has been muted by a Moderator. You cannot target them until their current mute has expired.";
        } else if(await checkIfFunnyMuted(targetMember)) {
            return "This user has already been muted by another paying customer. You cannot target them until their current mute has expired.";
        }
        const endDate = new Date(Date.now() + 15*60000); // 15 minutes from execution
        await targetMember.roles.add(funnyMuteRole);
        await createScheduledEvent("muteShort", targetMember.user.id, targetMember.guild.id, endDate);
        await message.channel.send("Successfully muted <@" + targetMember.id + "> for 15 minutes. Mods reserve the right to remove this mute manually for any reason.");
        return "";
    }, scheduledEvent: async (userID: string, guildID: string): Promise<string> => {
        try {
            var guild = client.guilds.cache.get(guildID);
            var member = guild?.members.cache.get(userID);
        } catch (e){return "Failed to get information about this event"}

        // If the role was removed manually then we don't need to do anything nor do we need to throw an error
        if(member?.roles.cache.get(funnyMuteRole) !== undefined) {
            await member?.roles.remove(funnyMuteRole);
            await member.send("Your mute that a paying customer imposed on you in the Octo GAMING Discord server has expired.");
        }
        return "";
    },
    requiresTarget: true, 
    description: `Mute some sorry sucker for 15 minutes. <@&` + Roles.gamerGod + `> and <@&` + Roles.gamerPolice + `> have immunity. Players muted with this will have the <@&`
        + funnyMuteRole + `> role.` 
    }],


    ["muteMedium", {name: "Mute Member (medium)", basePrice: 45, roleDiscounts: [],
    effect: async (message: Message, target: User): Promise<string> => {
        const targetMember: GuildMember | undefined = message.guild?.members.cache.get(target?.id);
        if(targetMember === undefined) {
            return "Targeted user is not in the server.";
        } else if(targetMember === message.member) {
            return "You cannot target yourself!";
        } else if(targetMember.user.bot) {
            return "You cannot target a bot."
        } else if(targetMember.roles.cache.hasAny(Roles.gamerGod, Roles.gamerPolice)) {
            return "You cannot target Gamer Gods or Gamer Police.";
        } else if(targetMember?.roles.cache.get(cringeMuteRole) !== undefined) {
            return "This user has been muted by a Moderator. You cannot target them until their current mute has expired.";
        } else if(await checkIfFunnyMuted(targetMember)) {
            return "This user has already been muted by another paying customer. You cannot target them until their current mute has expired.";
        }
        const endDate = new Date(Date.now() + 30*60000); // 30 minutes from execution
        await targetMember.roles.add(funnyMuteRole);
        await createScheduledEvent("muteMedium", targetMember.user.id, targetMember.guild.id, endDate);
        await message.channel.send("Successfully muted <@" + targetMember.id + "> for 30 minutes. Mods reserve the right to remove this mute manually for any reason.");
        return "";
    }, scheduledEvent: async (userID: string, guildID: string): Promise<string> => {
        try {
            var guild = client.guilds.cache.get(guildID);
            var member = guild?.members.cache.get(userID);
        } catch (e){return "Failed to get information about this event"}

        // If the role was removed manually then we don't need to do anything nor do we need to throw an error
        if(member?.roles.cache.get(funnyMuteRole) !== undefined) {
            await member?.roles.remove(funnyMuteRole);
            await member.send("Your mute that a paying customer imposed on you in the Octo GAMING Discord server has expired.");
        }
        return "";
    },
    requiresTarget: true, 
    description: `Mute an even sorrier sucker for 30 minutes. <@&` + Roles.gamerGod + `> and <@&` + Roles.gamerPolice + `> have immunity. Players muted with this will have the <@&`
        + funnyMuteRole + `> role.` 
    }],


    ["muteLong", {name: "Mute Member (LONG)", basePrice: 75, roleDiscounts: [],
    effect: async (message: Message, target: User): Promise<string> => {
        const targetMember: GuildMember | undefined = message.guild?.members.cache.get(target?.id);
        if(targetMember === undefined) {
            return "Targeted user is not in the server.";
        } else if(targetMember === message.member) {
            return "You cannot target yourself!";
        } else if(targetMember.user.bot) {
            return "You cannot target a bot."
        } else if(targetMember.roles.cache.hasAny(Roles.gamerGod, Roles.gamerPolice)) {
            return "You cannot target Gamer Gods or Gamer Police.";
        } else if(targetMember?.roles.cache.get(cringeMuteRole) !== undefined) {
            return "This user has been muted by a Moderator. You cannot target them until their current mute has expired.";
        } else if(await checkIfFunnyMuted(targetMember)) {
            return "This user has already been muted by another paying customer. You cannot target them until their current mute has expired.";
        }
        const endDate = new Date(Date.now() + 60*60000); // 60 minutes from execution
        await targetMember.roles.add(funnyMuteRole);
        await createScheduledEvent("muteLong", targetMember.user.id, targetMember.guild.id, endDate);
        await message.channel.send("Successfully muted <@" + targetMember.id + "> for an hour. Mods reserve the right to remove this mute manually for any reason.");
        return "";
    }, scheduledEvent: async (userID: string, guildID: string): Promise<string> => {
        try {
            var guild = client.guilds.cache.get(guildID);
            var member = guild?.members.cache.get(userID);
        } catch (e){return "Failed to get information about this event"}

        // If the role was removed manually then we don't need to do anything nor do we need to throw an error
        if(member?.roles.cache.get(funnyMuteRole) !== undefined) {
            await member?.roles.remove(funnyMuteRole);
            await member.send("Your mute that a paying customer imposed on you in the Octo GAMING Discord server has expired.");
        }
        return "";
    },
    requiresTarget: true, 
    description: `Mute the sorriest sucker you know for a whole hour. <@&` + Roles.gamerGod + `> and <@&` + Roles.gamerPolice + `> have immunity. Players muted with this will have the <@&`
        + funnyMuteRole + `> role.` 
    }],
]);

async function checkIfFunnyMuted(targetMember: GuildMember): Promise<boolean> {
    return  targetMember?.roles.cache.get(funnyMuteRole) !== undefined ||
    await getScheduledEvent(targetMember.user, targetMember.guild, "muteShort") !== null ||
    await getScheduledEvent(targetMember.user, targetMember.guild, "muteMedium") !== null ||
    await getScheduledEvent(targetMember.user, targetMember.guild, "muteLong") !== null
}

export async function getPricingInfoForUser(user: User, guild: Guild | null, item: ShopItem): Promise<{specialRole: string, discountPrice: number}> {

    let discountPrice: number = item.basePrice;
    let specialRole: string = "";

    let userSpecialRoles: Roles[] = await convertToRolesEnum(await getSpecialRoles(user, guild));
    const eligibleDiscountRoles: {role: Roles, dPrice: number}[] = item.roleDiscounts.filter((r) => {
        return userSpecialRoles.includes(r.role);
    });
    const hasDiscount: boolean = eligibleDiscountRoles.length > 0;
    if(hasDiscount) {
        ({ role: specialRole, dPrice: discountPrice } = eligibleDiscountRoles.reduce((prev, curr) => {
            return prev.dPrice <= curr.dPrice ? prev : curr;
        }));
    }
    return { specialRole, discountPrice };
}