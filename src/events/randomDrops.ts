import { Client, DiscordEvent } from "@frasermcc/overcord";
import { Collector, Emoji, Guild, GuildEmoji, Message, MessageAttachment, MessageFlags, ReactionCollector, ReactionEmoji, ReactionManager, ReactionUserManager, TextChannel, ThreadChannel, User } from "discord.js";
import * as fs from "fs";
import path from "path";
import { addBalance, octobuckBalance, subtractBalance } from "../database/octobuckBalance";
import { logRandomDropClaim } from "../utilities/log";

const counterStart = 1975; // Should be equal or under counterThreshold
const counterThreshold = 2000; // RNG has to exceed this threshold to trigger

// Probability of a particular value is inversely proportional to (1/value)^exponential. Should be close to and above 1.
// Increasing this disproportionately decreases the likelihood of rare drops.
const exponential = 1.1; 
const maxProbShare = 1/4; // Prevents very small octobuck values from dominating the probability.

let counter = counterStart;

const reactionEmoji = "Octocoin";

const values: number[] = [2, 3, 5, 6, 7, 12, 20, 28, 30, 40, 50, 69, 100];

const blockedChannels: string[] = ["828771529469853766", "887720173136658507", "789098821875531789"]; // Secret links, secret artist channel, spam chat
const blockedCategories: string[] = ["789109056756776971", "789098821875531788"]; // Super secret, Important stuff
let blockedUsers: string[] = []; // Dynamically pushed to whenever a drop occurs. Not persisted in DB since this isnt critical.

const RandomDropEvent: DiscordEvent<"messageCreate"> = {
    callback: async (message) => {
        if(message.author.bot || blockedUsers.includes(message.author.id) || blockedChannels.includes(message.channel.id) || 
            blockedCategories.includes((message.channel as TextChannel | ThreadChannel)?.parent?.id ?? "")) {
            return;
        }

        const guild = message.guild as Guild;

        counter++;
        const dropOctobuck = Math.random() * counter > counterThreshold;
        if(!dropOctobuck) {
            return;
        }        
        const valueToSend: number = getOctobuckValue();
        const gifPath = path.resolve(__dirname,"../../assets/octobucks/octobucks_" + valueToSend + ".gif");

        const octobuckEmoji: GuildEmoji = guild.emojis.cache.find(emoji => emoji.name === reactionEmoji) as GuildEmoji; // Octocoin emoji
        const octobuckMessage: Message = await message.channel.send({content: "First person to click on the reaction gets the Octobucks!", files: [gifPath]});
        octobuckMessage.react(octobuckEmoji);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reactionFilter = (reaction: any, user: any) => {
            return reaction.emoji.name === reactionEmoji && user.id !== octobuckMessage.client.user?.id && !user.bot;
        };

        let claimed = false;
        const reactionCollector: ReactionCollector = octobuckMessage.createReactionCollector({filter: reactionFilter, time: 15000, max: 1});
        
        reactionCollector.on("collect", async (reaction, user) => {
            if(!claimed) {
                claimed = true;
                // Anti fraud measures
                if(message.channel instanceof ThreadChannel) {
                    await subtractBalance(user, valueToSend, true);
                    octobuckMessage.edit("<@" + user.id + "> has claimed " + valueToSend + " Octobucks! Or did they?");
                    await logRandomDropClaim(user, valueToSend, counter - counterStart, true);
                } else {
                    await addBalance(user, valueToSend);
                    blockedUsers.push(user.id); // Block user from causing drop rate to increase (prevents single-user farming)
                    setTimeout(() => blockedUsers = blockedUsers.filter(u => u !== user.id), 1800000); // Unblock user after 30 minutes
                    octobuckMessage.edit("<@" + user.id + "> has claimed " + valueToSend + " Octobucks!");
                    await logRandomDropClaim(user, valueToSend, counter - counterStart, false);
                }
                counter = counterStart;
            }
        });

        reactionCollector.on("end", async collected => {
            if(!claimed && collected.size === 0) {
                const ruinedGifPath = path.resolve(__dirname,"../../assets/octobucks/octobucks_ruined.gif");
                await octobuckMessage.channel.send({content: "Nobody claimed the " + valueToSend + " Octobucks in time. What a shame!", files: [ruinedGifPath]});
                await octobuckMessage.delete();
            }
        });
    },
    firesOn: "messageCreate",
};

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

export default RandomDropEvent;