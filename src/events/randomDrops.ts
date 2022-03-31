import { Client, DiscordEvent } from "@frasermcc/overcord";
import { MessageAttachment, MessageFlags, TextChannel, ThreadChannel } from "discord.js";
import * as fs from "fs";
import path from "path";

const counterStart = 1000;
let counter = counterStart;

// Order least probable to most probable.
const probs: {prob: number, val: number}[] = [
    {prob: 0.1, val: 100},
    {prob: 0.9, val: 20},
    {prob: 25, val: 6},
    {prob: 33, val: 5},
    {prob: 41, val: 3}
];

const blockedChannels: string[] = ["828771529469853766", "887720173136658507", "789098821875531789"]; // Secret links, secret artist channel, spam chat
const blockedCategories: string[] = ["789109056756776971", "789098821875531788"]; // Super secret, Important stuff

const RandomDropEvent: DiscordEvent<"messageCreate"> = {
    callback: async (message) => {
        if(blockedCategories.includes(message.channel.id) || blockedCategories.includes((message.channel as TextChannel | ThreadChannel)?.parent?.id ?? "")) {
            return;
        }

        counter++;
        const dropOctobuck = Math.random() * counter > 1; // TODO: Change this to counterStart on launch.
        if(!dropOctobuck) {
            return;
        }        
        const valueToSend: number = getOctobuckValue();
        const gifPath = path.resolve(__dirname,"../assets/octobucks/octobucks_" + valueToSend + ".gif");
        counter = Math.max(counterStart, Math.floor(counter/1.1));
        message.channel.send({content: "First person to click on the reaction gets it!", files: [gifPath]});
    },
    firesOn: "messageCreate",
};

function getOctobuckValue(): number {
    const randomValue: number = Math.random() * 100;
    console.log("Random number: " + randomValue);
    let threshold = 0;
    for(let i = 0; i < probs.length; i++) {
        threshold += probs[i].prob;
        console.log(threshold);
        if(randomValue < threshold) {
            console.log("Octobuck value: " + probs[i].val);
            return probs[i].val;
        }
    }
    return probs[-1].val;
}

export default RandomDropEvent;