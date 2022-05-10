// Shop items are concretely defined here. Changes require update to the code.

import { Collection, Message, User, Permissions, GuildMember, Guild, TextChannel } from "discord.js";
import { client } from "..";
import { addTicket, getLotteryDrawTime, getTicket } from "../database/lottery";
import { createScheduledEvent, getScheduledEvent } from "../database/schedule";
import { convertToRolesEnum, getAllRoles, getSpecialRoles } from "./helpers";
import { cringeMuteRole, funnyMuteRole, nickNameRole, SpecialRole, basementDwellerRole, offTopicImageRole } from "./config";

export type ShopItem = {
    name: string,
    commandSyntax: string,
    basePrice: number,
    roleDiscounts: {role: SpecialRole, dPrice: number}[],
    // Purchases should always have a message associated with them; user and guild can be derived from this.
    // Additional arguments are the responsibility of shop item implementers to manage.
    // returns: true if successfully used. false otherwise. Indicates to caller whether to consume a consumable.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    effect: (message: Message, argument: string) => Promise<string>,
    scheduledEvent: null | ((userID: string, guildID: string) => Promise<string>),
    description: string,
    requiresArgument: boolean
}

export const shopItems: Map<string, ShopItem> = new Map<string, ShopItem>([
    ["lottery", {name: "Lottery Ticket", commandSyntax: "lottery", basePrice: 5, roleDiscounts:
        [ {role: SpecialRole.memeMachine, dPrice: 4} ],
    effect: async (message: Message): Promise<string> => {
        if(await getTicket(message.author) !== undefined) {
            return "You already purchased a lottery ticket. Next draw is in " + ((((await getLotteryDrawTime()).getTime() - Date.now())/3600000).toPrecision(3) + " hours");
        }
        await addTicket(message.author);
        message.reply("You have purchased a lottery ticket. Next draw is in " + ((((await getLotteryDrawTime()).getTime() - Date.now())/3600000).toPrecision(3) + " hours"));
        return "";
        
    }, scheduledEvent: async (userID: string, guildID: string): Promise<string> => {
        return "This shopItem doesn't implement any scheduled events.";
    },
    requiresArgument: false, 
    description: "- Gives you a chance at winning a prize of Octobucks.\n- The prize increases as more tickets are purchased.\n- Lottery is drawn daily at midnight UTC.\n - Type `$lottery` to check the lottery status."
    }],


    ["nickname", {name: "Nickname Perms", commandSyntax: "nickname", basePrice: 10, roleDiscounts: [{role: SpecialRole.gamerGod, dPrice: 0}, {role: SpecialRole.gamerPolice, dPrice: 0}, 
        {role: SpecialRole.memeMachine, dPrice: 0}, {role: SpecialRole.famousArtist, dPrice: 0}, {role: SpecialRole.ggsVeteran, dPrice: 0}, {role: SpecialRole.gigaGamer, dPrice: 0}], 
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
        await message.channel.send("You have five minutes to change your nickname to whatever you want! Right click your avatar -> Edit server profile");
        const endDate = new Date(Date.now() + 5*60000); // five minutes from execution
        const result: string = await createScheduledEvent("nickname", message.author.id, message.guild?.id, endDate) ? "" : "An error occured scheduling the five minute window";
        return result;
    }, scheduledEvent: async (userID: string, guildID: string): Promise<string> => {
        let member;
        try {
            const guild = client.guilds.cache.get(guildID);
            member = guild?.members.cache.get(userID);
        } catch (e){return "Failed to get information about this event";}

        // If the role was removed manually then we don't need to do anything nor do we need to throw an error
        if(member?.roles.cache.get(nickNameRole) !== undefined) {
            await member?.roles.remove(nickNameRole);
        }
        return "";
    },
    requiresArgument: false, 
    description: "- Gives you permission to change your nickname for 5 minutes.\n- Once that time's up you're stuck with whatever you chose!"
    }],


    ["muteShort", {name: "Mute Member (short)", commandSyntax: "muteShort <user>", basePrice: 25, roleDiscounts: [],
        effect: async (message: Message, argument: string): Promise<string> => {
            const targetMember: GuildMember | undefined = message.guild?.members.cache.get((await interpretArgument(argument) as User).id);
            if(targetMember === undefined) {
                return "Targeted user is not in the server.";
            } else if(targetMember === message.member) {
                return "You cannot target yourself!";
            } else if(targetMember.user.bot) {
                return "You cannot target a bot.";
            } else if(targetMember.roles.cache.hasAny(SpecialRole.gamerGod, SpecialRole.gamerPolice)) {
                return "You cannot target Gamer Gods or Gamer Police.";
            } else if(targetMember?.roles.cache.get(cringeMuteRole) !== undefined) {
                return "This user has been muted by a Moderator. You cannot target them until their current mute has expired.";
            } else if(await checkIfFunnyMuted(targetMember)) {
                return "This user has already been muted by another paying customer. You cannot target them until their current mute has expired.";
            }
            const endDate = new Date(Date.now() + 15*60000); // 15 minutes from execution
            await targetMember.roles.add(funnyMuteRole);
            await createScheduledEvent("muteShort", targetMember.user.id, targetMember.guild.id, endDate);
            await message.reply("Successfully muted <@" + targetMember.id + "> for 15 minutes. Mods reserve the right to remove this mute manually for any reason.");
            return "";
        }, scheduledEvent: async (userID: string, guildID: string): Promise<string> => {
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
        },
        requiresArgument: true, 
        description: "- Mute some sorry sucker for 15 minutes.\n- <@&" + SpecialRole.gamerGod + "> and <@&" + SpecialRole.gamerPolice + "> have immunity.\n- Players muted with this will have the <@&"
        + funnyMuteRole + "> role." 
    }],


    ["basement", {name: "Keys to Octo's Basement", commandSyntax: "basement", basePrice: 35, roleDiscounts: [{role: SpecialRole.gamerGod, dPrice: 0}, {role: SpecialRole.gamerPolice, dPrice: 0}, 
        {role: SpecialRole.memeMachine, dPrice: 0}, {role: SpecialRole.famousArtist, dPrice: 0}, {role: SpecialRole.ggsVeteran, dPrice: 0}, {role: SpecialRole.gigaGamer, dPrice: 0}],
    effect: async (message: Message): Promise<string> => {
        if(message.member?.roles.cache.get(basementDwellerRole) !== undefined) {
            return "You already have the keys to the basement. Check your pockets again.";
        }
        await message.member?.roles.add(basementDwellerRole);
        await message.reply("You have been given the keys to the basement. Don't lose them!");
        return "";
    }, scheduledEvent: async (userID: string, guildID: string): Promise<string> => {
        return "This shopItem doesn't implement any scheduled events.";
    },
    requiresArgument: false, 
    description: "- These keys will give you access to the dusty, cramped corners of Octo's basement.\n- Become a <@&" + basementDwellerRole + "> like us!" 
    }],


    ["muteMedium", {name: "Mute Member (medium)", commandSyntax: "muteMedium <user>", basePrice: 45, roleDiscounts: [],
        effect: async (message: Message, argument: string): Promise<string> => {
            const targetMember: GuildMember | undefined = message.guild?.members.cache.get((await interpretArgument(argument) as User).id);
            if(targetMember === undefined) {
                return "Targeted user is not in the server.";
            } else if(targetMember === message.member) {
                return "You cannot target yourself!";
            } else if(targetMember.user.bot) {
                return "You cannot target a bot.";
            } else if(targetMember.roles.cache.hasAny(SpecialRole.gamerGod, SpecialRole.gamerPolice)) {
                return "You cannot target Gamer Gods or Gamer Police.";
            } else if(targetMember?.roles.cache.get(cringeMuteRole) !== undefined) {
                return "This user has been muted by a Moderator. You cannot target them until their current mute has expired.";
            } else if(await checkIfFunnyMuted(targetMember)) {
                return "This user has already been muted by another paying customer. You cannot target them until their current mute has expired.";
            }
            const endDate = new Date(Date.now() + 30*60000); // 30 minutes from execution
            await targetMember.roles.add(funnyMuteRole);
            await createScheduledEvent("muteMedium", targetMember.user.id, targetMember.guild.id, endDate);
            await message.reply("Successfully muted <@" + targetMember.id + "> for 30 minutes. Mods reserve the right to remove this mute manually for any reason.");
            return "";
        }, scheduledEvent: async (userID: string, guildID: string): Promise<string> => {
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
        },
        requiresArgument: true, 
        description: "- Mute an even sorrier sucker for 30 minutes.\n- <@&" + SpecialRole.gamerGod + "> and <@&" + SpecialRole.gamerPolice + "> have immunity.\n- Players muted with this will have the <@&"
        + funnyMuteRole + "> role." 
    }],


    ["offTopic", {name: "#off-topic Image Perms", commandSyntax: "offTopic", basePrice: 50, roleDiscounts: [{role: SpecialRole.gamerGod, dPrice: 0}, {role: SpecialRole.gamerPolice, dPrice: 0}, 
        {role: SpecialRole.memeMachine, dPrice: 0}, {role: SpecialRole.famousArtist, dPrice: 0}, {role: SpecialRole.ggsVeteran, dPrice: 0}, {role: SpecialRole.gigaGamer, dPrice: 0}],
    effect: async (message: Message): Promise<string> => {
        if(message.member?.roles.cache.get(offTopicImageRole) !== undefined) {
            return "You already have permission to post images in #general-off-topic";
        }
        await message.member?.roles.add(offTopicImageRole);
        await message.reply("You can now post images in <#818595825143382076>. Please don't turn it into <#789106617407766548> 2.0 thanks.");
        return "";
    }, scheduledEvent: async (userID: string, guildID: string): Promise<string> => {
        return "This shopItem doesn't implement any scheduled events.";
    },
    requiresArgument: false, 
    description: "- Gain the unholy power of posting images and embedding links in <#818595825143382076> and become an <@&" + offTopicImageRole + ">" 
    }],


    ["muteLong", {name: "Mute Member (LONG)", commandSyntax: "muteLong <user>", basePrice: 75, roleDiscounts: [],
        effect: async (message: Message, argument: string): Promise<string> => {
            const targetMember: GuildMember | undefined = message.guild?.members.cache.get((await interpretArgument(argument) as User).id);
            if(targetMember === undefined) {
                return "Targeted user is not in the server.";
            } else if(targetMember === message.member) {
                return "You cannot target yourself!";
            } else if(targetMember.user.bot) {
                return "You cannot target a bot.";
            } else if(targetMember.roles.cache.hasAny(SpecialRole.gamerGod, SpecialRole.gamerPolice)) {
                return "You cannot target Gamer Gods or Gamer Police.";
            } else if(targetMember?.roles.cache.get(cringeMuteRole) !== undefined) {
                return "This user has been muted by a Moderator. You cannot target them until their current mute has expired.";
            } else if(await checkIfFunnyMuted(targetMember)) {
                return "This user has already been muted by another paying customer. You cannot target them until their current mute has expired.";
            }
            const endDate = new Date(Date.now() + 60*60000); // 60 minutes from execution
            await targetMember.roles.add(funnyMuteRole);
            await createScheduledEvent("muteLong", targetMember.user.id, targetMember.guild.id, endDate);
            await message.reply("Successfully muted <@" + targetMember.id + "> for an hour. Mods reserve the right to remove this mute manually for any reason.");
            return "";
        }, scheduledEvent: async (userID: string, guildID: string): Promise<string> => {
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
        },
        requiresArgument: true, 
        description: "- Mute the sorriest sucker you know for a whole hour.\n- <@&" + SpecialRole.gamerGod + "> and <@&" + SpecialRole.gamerPolice + "> have immunity.\n- Players muted with this will have the <@&"
        + funnyMuteRole + "> role." 
    }],
]);

async function checkIfFunnyMuted(targetMember: GuildMember): Promise<boolean> {
    return  targetMember?.roles.cache.get(funnyMuteRole) !== undefined ||
    await getScheduledEvent(targetMember.user, targetMember.guild, "muteShort") !== null ||
    await getScheduledEvent(targetMember.user, targetMember.guild, "muteMedium") !== null ||
    await getScheduledEvent(targetMember.user, targetMember.guild, "muteLong") !== null;
}

// Only arguments of the type listed here may be used as ShopItem arguments
async function interpretArgument(arg: string): Promise<User | TextChannel | null> {
    const id = arg.trim().slice(2, -1); // Turns <@12345> into 12345
    if(client.users.cache.has(id)) {
        return (client.users.cache.get(id) as User);
    }
    if(client.channels.cache.has(id) && client.channels.cache.get(id)?.type === "GUILD_TEXT") {
        return (client.channels.cache.get(id) as TextChannel);
    }
    
    return null;
}

export async function getPricingInfoForUser(user: User, guild: Guild | null, item: ShopItem): Promise<{specialRole: string, discountPrice: number}> {

    let discountPrice: number = item.basePrice;
    let specialRole = "";

    const userSpecialRoles: SpecialRole[] = await convertToRolesEnum(await getSpecialRoles(user, guild));
    const eligibleDiscountRoles: {role: SpecialRole, dPrice: number}[] = item.roleDiscounts.filter((r) => {
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