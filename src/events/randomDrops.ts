import { Client, DiscordEvent } from "@frasermcc/overcord";
import { Collector, Emoji, Guild, GuildEmoji, Message, MessageAttachment, MessageFlags, ReactionCollector, ReactionEmoji, ReactionManager, ReactionUserManager, TextChannel, ThreadChannel, User } from "discord.js";
import * as fs from "fs";
import path from "path";
import { addBalance, octobuckBalance } from "../database/octobuckBalance";
import { logRandomDropClaim } from "../utilities/log";

const counterStart = 980; // Should be equal or under counterThreshold
const counterThreshold = 1000; // RNG has to exceed this threshold to trigger
let counter = counterStart;

const reactionEmoji = "Octocoin";

// Order least probable to most probable.
const probs: {prob: number, val: number}[] = [
    {prob: 1, val: 100},
    {prob: 1.5, val: 50},
    {prob: 2.5, val: 30},
    {prob: 3, val: 28},
    {prob: 4, val: 20},
    {prob: 8, val: 12},
    {prob: 12, val: 7},
    {prob: 14, val: 6},
    {prob: 22, val: 5},
    {prob: 32, val: 3}
];

const blockedChannels: string[] = ["828771529469853766", "887720173136658507", "789098821875531789"]; // Secret links, secret artist channel, spam chat
const blockedCategories: string[] = ["789109056756776971", "789098821875531788"]; // Super secret, Important stuff

const RandomDropEvent: DiscordEvent<"messageCreate"> = {
    callback: async (message) => {
        if(message.author.bot || blockedChannels.includes(message.channel.id) || blockedCategories.includes((message.channel as TextChannel | ThreadChannel)?.parent?.id ?? "")) {
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
                octobuckMessage.edit("<@" + user.id + "> has claimed " + valueToSend + " Octobucks!");
                await addBalance(user, valueToSend);
                await logRandomDropClaim(user, valueToSend, counter);
                counter = Math.max(counterStart, Math.floor(counter/1.1));
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

function getOctobuckValue(): number {
    const randomValue: number = Math.random() * 100;
    let threshold = 0;
    for(let i = 0; i < probs.length; i++) {
        threshold += probs[i].prob;
        if(randomValue < threshold) {
            return probs[i].val;
        }
    }
    return probs[-1].val;
}

export default RandomDropEvent;