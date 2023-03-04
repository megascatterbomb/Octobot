import { Guild, Message, MessageEmbed, MessageReaction, PartialMessageReaction, PartialUser, TextChannel, User } from "discord.js";
import { unwatchFile } from "fs";
import { model, Schema, Model, Types} from "mongoose";
import { client } from "..";
import { logLotteryDraw } from "../utilities/log";
import { shopItems, ShopItem } from "../utilities/shop";
import { allowedChannels, scheduleChannel} from "../utilities/config";
import { addBalance } from "./octobuckBalance";
import { setFlagsFromString } from "v8";
import { Client } from "@frasermcc/overcord";

const msInWeek = 604800000;
const msInDay = 86400000;
const msInHour = 3600000;

const hoursPerEvent = 2; // Can realistically only be 2, 3, 4, or 6
const eventsToSkip = 2; // How many events immediately following the initial posting should be skipped.
const eventDuration = msInHour * hoursPerEvent;

interface TF2Event {
    startTime: Date,
    endTime: Date,
    attendingUsers: string[],
    maxPlayerCount: number // Max player count seen either through reactions or on the server, used to prevent pinging the same role multiple times for the same event. -1 before event starts.
    playerLimit: number
    cancelledStatus: string // Prevents users from reacting, provides this as a reason. Empty string means not cancelled
    eventID: string
    messageID: string | undefined
}

const tf2EventSchema = new Schema<TF2Event>({
    startTime: {type: Date, required: true},
    endTime: {type: Date, required: true},
    attendingUsers: {type: [String], required: true},
    maxPlayerCount: {type: Number, required: true},
    cancelledStatus: {type: String, required: true},
    eventID: {type: String, required: true, unique: true},
    messageID: {type: String},
    playerLimit: {type: Number, required: true}
}, {
    timestamps: {},
    collection: "TF2Events",
});

const tf2Event: Model<TF2Event> = model<TF2Event>("TF2Events", tf2EventSchema, "TF2Events");

export {tf2Event};

let currentTf2Events: TF2Event[] = [];

// NEVER call this function outside of /index.ts
export async function tf2Loop() {
    if(process.env.ENVIRONMENT !== "PRODUCTION") {
        return;
    }
    currentTf2Events = await tf2Event.find().exec();
    client.on("messageReactionAdd", async (messageReaction, user) => {
        await interpretReaction(true, user, messageReaction);
    });
    client.on("messageReactionRemove", async (messageReaction, user) => {
        await interpretReaction(false, user, messageReaction);
    });
    // eslint-disable-next-line no-constant-condition
    while(true) {
        const currentTime = Date.now();
        const thisWeekStart = Math.floor((currentTime - 1) / msInWeek) * msInWeek;
        if(await tf2Event.find({endTime: {$gte: new Date(currentTime)}}).count() === 0) {
            await newSchedule(thisWeekStart);
        }

        // Wait another 5 seconds, helps prevent out-of-order execution.
        await delay(new Date(thisWeekStart + msInWeek + 5000));
    }
}

async function interpretReaction(state: boolean, user: User | PartialUser, reaction: MessageReaction | PartialMessageReaction) {
    const letter = reactionToLetter(reaction);

    if(reaction.message.channelId !== scheduleChannel || letter === null) return;

    const messageID = reaction.message.id;

    const matchingEvent: TF2Event | null = await tf2Event.findOne({eventID: {$regex: letter + "$"}, messageID: messageID});
    if(matchingEvent === null) return;
    if(state && !matchingEvent.attendingUsers.includes(user.id)) {
        matchingEvent.attendingUsers.push(user.id);
    } else if (!state && matchingEvent.attendingUsers.includes(user.id)) {
        matchingEvent.attendingUsers = matchingEvent.attendingUsers.filter(u => u !== user.id);
    }
    
}

function toRegionalIndicator(text: string): string {
    const regionalIndicatorA = "\u{1F1E6}";
    const codeA = "A".charCodeAt(0);
    const regionalIndicators: Record<number, string> = {};

    for (let i = 0; i < 26; i++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        regionalIndicators[codeA + i] = String.fromCodePoint(regionalIndicatorA.codePointAt(0)! + i);
    }

    return text
        .split("")
        .map((char) => regionalIndicators[char.charCodeAt(0)] ?? char)
        .join("");
}

function reactionToLetter(reaction: MessageReaction | PartialMessageReaction): string | null {
    const emojiString = reaction.emoji.toString();
  
    // Check that the input is a valid regional indicator symbol
    const regex = /^<:regional_indicator_[a-z]{1}>$/u;
    if (!regex.test(emojiString)) {
        return null;
    }
  
    // Extract the letter from the emoji string
    const letter = emojiString.substr(20, 1);
  
    return letter;
}

export async function newSchedule(thisWeekStart: number): Promise<boolean> {
    
    let skip = eventsToSkip;
    const nextWeekStart = thisWeekStart + msInWeek;

    const newEvents: TF2Event[] = [];
    const channel = client.channels.resolve(scheduleChannel) as TextChannel | undefined;
    if(channel === undefined) throw new Error("Invalid TF2 Schedule channel");

    for(let i = thisWeekStart; i < nextWeekStart; i += eventDuration) {
        const thisEventStart = i;
        const thisDayStart = Math.floor(thisEventStart / msInDay) * msInDay;
        const thisEventEnd = i + (msInHour * hoursPerEvent);

        const eventID = `${thisDayStart}-${String.fromCharCode((Math.floor((thisEventStart - thisDayStart) / eventDuration)) + 1 + 64)}`;

        const event: TF2Event = {
            startTime: new Date(thisEventStart),
            endTime: new Date(thisEventEnd),
            attendingUsers: [],
            maxPlayerCount: -1,
            cancelledStatus: "",
            eventID: eventID,
            messageID: undefined,
            playerLimit: 32
        };

        if(skip > 0) {
            skip--;
            event.cancelledStatus = "Too soon to gauge interest";
            continue;
        }

        newEvents.push(event);
    }

    await channel.bulkDelete(100);

    currentTf2Events = await constructAndPostMessages(newEvents, thisWeekStart);
    await tf2Event.deleteMany();
    await tf2Event.create(currentTf2Events);
    
    return true;
}

async function constructAndPostMessages(events: TF2Event[], thisWeekStart: number): Promise<TF2Event[]> {
    const nextWeekStart = thisWeekStart + msInWeek;
    const map = new Map<number, TF2Event[]>();
    events.sort((a, b) => a.startTime.valueOf() - b.startTime.valueOf()).forEach(event => {
        const eventDay = Math.floor(event.startTime.valueOf() / msInDay) * msInDay;
        const entry = map.get(eventDay);
        if(entry === undefined) {
            map.set(eventDay, [event]);
        } else {
            entry.push();
        }
    });
    const eventsByDay: TF2Event[][] = Array.from(map.values());
    const embeds: MessageEmbed[] = [];

    for(const day of eventsByDay) {
        const dayTimeStamp = day[0].startTime; // We know it's sorted.
        const embed = new MessageEmbed();

        embed.setTitle(`${dayTimeStamp.getUTCDay()} ${dayTimeStamp.getUTCFullYear()} - ${dayTimeStamp.getUTCMonth() + 1} - ${dayTimeStamp.getUTCDate()} (UTC)`);

        const fieldNames = ["A:", "B:", "C:", "D:", "E:", "F:", "G:", "H:", "I:", "J:", "K:", "L:"];

        for(const event of day) {
            const start = event.startTime.valueOf();
            const end = event.endTime.valueOf();
            let value = `<t:${start}:D>\n<t:${start}:t> to <t:${end}:t>\n${event.attendingUsers.length}/${event.playerLimit}`;

            if(event.startTime.valueOf() < Date.now() && event.endTime.valueOf() > Date.now()) {
                value = `Happening now\nEnds <t:${end}:R> (<t:${end}:t>)\n${event.attendingUsers.length}/${event.playerLimit}`;
            } else if(event.startTime.valueOf() - Date.now() > 0 && event.startTime.valueOf() - Date.now() < 1 * msInHour) {
                value = `Starts <t:${start}:R> (<t:${start}:t>)\n Ends <t:${end}:t>\n${event.attendingUsers.length}/${event.playerLimit}`;
            }

            embed.addField( fieldNames[Math.floor(event.startTime.valueOf() / msInDay)], value, true);
        }
        embeds.push(embed);
    }

    
}

function delay(date: Date) {
    const time = date.getTime() - Date.now();
    if(time <= 0) {
        return new Promise(resolve => setTimeout(resolve, 0));
    }
    return new Promise(resolve => setTimeout(resolve, time));
}
