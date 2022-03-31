import { Client, DiscordEvent } from "@frasermcc/overcord";
import { Collector, Emoji, Guild, GuildEmoji, Message, MessageAttachment, MessageFlags, ReactionCollector, ReactionEmoji, ReactionManager, ReactionUserManager, TextChannel, ThreadChannel, User } from "discord.js";
import * as fs from "fs";
import path from "path";
import { addBalance, octobuckBalance } from "../database/octobuckBalance";

const counterStart = 1000; // Higher number = more rare
let counter = counterStart;

const reactionEmoji = "Octocoin";

// Order least probable to most probable.
const probs: {prob: number, val: number}[] = [
    {prob: 1, val: 100},
    {prob: 7, val: 20},
    {prob: 21, val: 6},
    {prob: 27, val: 5},
    {prob: 44, val: 3}
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
        const dropOctobuck = Math.random() * counter > counterStart;
        if(!dropOctobuck) {
            return;
        }        
        const valueToSend: number = getOctobuckValue();
        const gifPath = path.resolve(__dirname,"../assets/octobucks/octobucks_" + valueToSend + ".gif");

        const octobuckEmoji: GuildEmoji = guild.emojis.cache.find(emoji => emoji.name === reactionEmoji) as GuildEmoji; // Octocoin emoji
        const octobuckMessage: Message = await message.channel.send({content: "First person to click on the reaction gets the Octobucks!", files: [gifPath]});
        octobuckMessage.react(octobuckEmoji);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reactionFilter = (reaction: any, user: any) => {
            return reaction.emoji.name === reactionEmoji && user.id !== octobuckMessage.client.user?.id && !user.bot;
        };

        let claimed = false;
        const reactionCollector: ReactionCollector = octobuckMessage.createReactionCollector({filter: reactionFilter, time: 15000, max: 1});
        
        reactionCollector.on("collect", (reaction, user) => {
            if(!claimed) {
                claimed = true;
                counter = Math.max(counterStart, Math.floor(counter/1.1));
                octobuckMessage.edit("<@" + user.id + "> has claimed " + valueToSend + " Octobucks!");
                addBalance(user, valueToSend);
            }
        });

        reactionCollector.on("end", collected => {
            if(!claimed && collected.size === 0) {
                const ruinedGifPath = path.resolve(__dirname,"../assets/octobucks/octobucks_ruined.gif");
                octobuckMessage.channel.send({content: "Nobody claimed the Octobucks in time. What a shame!", files: [ruinedGifPath]});
                octobuckMessage.delete();
            }
        });
    },
    firesOn: "messageCreate",
};

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