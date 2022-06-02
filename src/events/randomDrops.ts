import { Client, DiscordEvent } from "@frasermcc/overcord";
import { Channel, Collector, Emoji, Guild, GuildEmoji, Message, MessageAttachment, MessageFlags, ReactionCollector, ReactionEmoji, ReactionManager, ReactionUserManager, TextChannel, ThreadChannel, User } from "discord.js";
import * as fs from "fs";
import path from "path";
import { addBalance, octobuckBalance, subtractBalance } from "../database/octobuckBalance";
import { logRandomDropClaim } from "../utilities/log";

const counterStart = 1975; // Should be equal or under counterThreshold
const counterThreshold = 2000; // RNG has to exceed this threshold to trigger

export let activeTraps = 0;

// Probability of a particular value is inversely proportional to (1/value)^exponential. Should be close to and above 1.
// Increasing this disproportionately decreases the likelihood of rare drops.
const exponential = 1.4; 
const maxProbShare = 1/4; // Prevents very small octobuck values from dominating the probability.

let counter = counterStart;

const reactionEmoji = "Octocoin";

const values: number[] = [2, 3, 5, 6, 7, 12, 20, 28, 30, 40, 50, 69, 100];

const blockedChannels: string[] = ["828771529469853766", "887720173136658507", "789098821875531789"]; // Secret links, secret artist channel, spam chat
const blockedCategories: string[] = ["789109056756776971", "789098821875531788"]; // Super secret, Important stuff
let blockedUsers: string[] = []; // Dynamically pushed to whenever a drop occurs. Not persisted in DB since this isnt critical.

export async function checkIfDropsBlocked(channel: Channel): Promise<boolean> {
    return !(channel.type === "GUILD_TEXT" || channel.type === "GUILD_PUBLIC_THREAD" || channel.type === "GUILD_PRIVATE_THREAD") || 
            blockedChannels.includes(channel.id) || blockedCategories.includes((channel as TextChannel | ThreadChannel)?.parent?.id ?? "");
}

const RandomDropEvent: DiscordEvent<"messageCreate"> = {
    callback: async (message) => {
        if(message.author.bot || blockedUsers.includes(message.author.id) || await checkIfDropsBlocked(message.channel as Channel)) {
            return;
        }

        const guild = message.guild as Guild;

        counter++;
        const dropOctobuck = Math.random() * counter > counterThreshold;
        if(!dropOctobuck) {
            return;
        }
        
        const drop: {user: User|null|undefined, value: number, msg: Message} = await doDrop(message.channel as TextChannel | ThreadChannel);
        
        if(drop.user !== undefined && drop.user !== null) {
            // Anti fraud measures
            if(message.channel instanceof ThreadChannel) {
                await subtractBalance(drop.user, drop.value, true);
                drop.msg.edit("<@" + drop.user.id + "> has claimed " + drop.value + " Octobucks! Or did they?");
                await logRandomDropClaim(drop.user, drop.value, counter - counterStart, true);
            } else {
                await addBalance(drop.user, drop.value);
                blockedUsers.push(drop.user.id); // Block user from causing drop rate to increase (prevents single-user farming)
                setTimeout(() => blockedUsers = blockedUsers.filter(u => u !== drop.user?.id), 1800000); // Unblock user after 30 minutes
                drop.msg.edit("<@" + drop.user.id + "> has claimed " + drop.value + " Octobucks!");
                await logRandomDropClaim(drop.user, drop.value, counter - counterStart, false);
            }
            counter = counterStart;
        // If nobody claims in time;
        } else {
            const ruinedGifPath = path.resolve(__dirname,"../../assets/octobucks/octobucks_ruined.gif");
            await drop.msg.channel.send({content: "Nobody claimed the " + drop.value + " Octobucks in time. What a shame!", files: [ruinedGifPath]});
            await drop.msg.delete();
        }
    },
    firesOn: "messageCreate",
};

export async function doDrop(channel: TextChannel | ThreadChannel, invalidUsers: string[] = []): Promise<{user: User|null|undefined, value: number, msg: Message}> {

    const valueToSend: number = getOctobuckValue();
    const gifPath = path.resolve(__dirname,"../../assets/octobucks/octobucks_" + valueToSend + ".gif");

    const octobuckEmoji: GuildEmoji = channel.guild.emojis.cache.find(emoji => emoji.name === reactionEmoji) as GuildEmoji; // Octocoin emoji
    const octobuckMessage: Message = await channel.send({content: "First person to click on the reaction gets the Octobucks!", files: [gifPath]});
    octobuckMessage.react(octobuckEmoji);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reactionFilter = (reaction: any, user: any) => {
        return reaction.emoji.name === reactionEmoji && user.id !== octobuckMessage.client.user?.id && !user.bot && !invalidUsers.includes(user.id);
    };

    const returnValue: {user: User | null | undefined, value: number, msg: Message} = {user: undefined, value: valueToSend, msg: octobuckMessage};

    let claimed = false;
    const reactionCollector: ReactionCollector = octobuckMessage.createReactionCollector({filter: reactionFilter, time: 15000, max: 1});
    
    reactionCollector.on("collect", async (reaction, user) => {
        if(!claimed) {
            claimed = true;
            returnValue.user = user;
        }
    });

    reactionCollector.on("end", async collected => {
        if(!claimed && collected.size === 0) {
            returnValue.user = null;
        }
    });
    
    while(returnValue.user === undefined) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    return returnValue;
}

export function getCounterValue(): number {
    return counter;
}

function getProb(value: number): number {
    return Math.min((1/value) ** exponential, maxProbShare);
}

function getOctobuckValue(): number {
    // Reciprocals used to give high-value Octobucks the lowest probability.
    const sortedValues = values.sort((a, b) => b - a);
    const randomValue: number = Math.random() * sortedValues.reduce((acc, curr) => acc + getProb(curr), 0);
    let threshold = 0;
    for(let i = 0; i < sortedValues.length; i++) {
        threshold += getProb(sortedValues[i]);
        if(randomValue < threshold) {
            return sortedValues[i];
        }
    }
    // If for some reason the loop doesnt resolve, get the lowest value Octobuck.
    return sortedValues[-1];
}

export function incrementActiveTraps() {
    activeTraps++;
}

export function decrementActiveTraps() {
    activeTraps--;
}

export default RandomDropEvent;