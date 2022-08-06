import { Client, DiscordEvent } from "@frasermcc/overcord";
import { Guild, GuildMember, MessageEmbed, TextChannel } from "discord.js";
import { ReturnDocument } from "mongodb";
import { client } from "..";
import { raidNotificationChannel, SpecialRole } from "../utilities/config";

let timeout: NodeJS.Timeout | null;
let safeTimeout: NodeJS.Timeout | null;
let markedSafe = false;

let raidThresholdTimeoutMinutes = 5;
let raidThresholdSeconds = 30;
let raidThresholdCount = 20;
export let raidTriggered = false;
let recentJoins: GuildMember[] = [];
let raidJoins: GuildMember[] = [];

const RaidEvent: DiscordEvent<"guildMemberAdd"> = {
    callback: async (member) => {
        if(!recentJoins.includes(member)) recentJoins.push(member);
        setTimeout(() => { if(recentJoins.includes(member)) recentJoins.filter(m => m.id !== member.id); } , raidThresholdSeconds * 1000);

        if(markedSafe || recentJoins.length < raidThresholdCount) return;
        timeout?.refresh();
        raidJoins.push(member);

        if(raidTriggered) return;
        timeout = setTimeout(() => EndRaid(), raidThresholdTimeoutMinutes * 60 * 1000);
        raidTriggered = true;
        raidJoins = [...recentJoins];
        SendRaidNotification(member.guild);
    },
    firesOn: "guildMemberAdd",
};

async function SendRaidNotification(guild: Guild) {
    const embed = new MessageEmbed();
    embed.setTitle("Alert: A lot of accounts just joined at once! Use the commands below to deal with the situation if necessary.");
    embed.addField("$raidkick", "Kick all the accounts that joined");
    embed.addField("$raidban", "Ban all the accounts that joined");
    embed.addField("$raidsafe", "Mark this as not a raid");
    embed.setColor("RED");
    embed.setFooter({text: "Raid system will automatically shut off after " + raidThresholdTimeoutMinutes + " minutes of no joins."});

    const channel = guild.channels.cache.get(raidNotificationChannel) as TextChannel;
    channel.send({ content: "<@&" + SpecialRole.gamerPolice + ">", embeds: [embed]});
}

// End the raid, returns users in raid so the function caller can deal with them.
export function EndRaid() {
    timeout = null;
    const raiders = [...raidJoins].filter((value, index, array) => array.findIndex(r => r.id === value.id) === index); // copy and filter duplciates
    raidJoins = [];
    recentJoins = [];
    raidTriggered = false;
    return raiders;
}

export function MarkSafe() {
    markedSafe = true;
    safeTimeout = setTimeout(() => markedSafe = false, raidThresholdTimeoutMinutes * 60 * 1000);
}

export function UpdateThresholdSeconds(seconds: number) {
    raidThresholdSeconds = seconds;
}
export function UpdateThreshold(count: number) {
    raidThresholdCount = count;
}
export function UpdateTimeout(minutes: number) {
    raidThresholdTimeoutMinutes = minutes;
}

export default RaidEvent;