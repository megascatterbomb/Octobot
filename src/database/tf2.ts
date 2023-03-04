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
import {Server, RCON, MasterServer} from "@fabricio-191/valve-server-query";

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
    eventTitle: string
    cancelledStatus: string | undefined // Prevents users from reacting, provides this as a reason. undefined means not cancelled
    eventID: string
    messageID: string | undefined
}

const tf2EventSchema = new Schema<TF2Event>({
    startTime: {type: Date, required: true},
    endTime: {type: Date, required: true},
    attendingUsers: {type: [String], required: true},
    maxPlayerCount: {type: Number, required: true},
    eventTitle: {type: String, required: true},
    cancelledStatus: {type: String},
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
    await tf2Event.deleteMany();
    // if(process.env.ENVIRONMENT !== "PRODUCTION") {
    //     return;
    // }
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

    if(user.bot || reaction.message.channelId !== scheduleChannel || letter === null) return;

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
    try {
        await channel.bulkDelete(100);
    // eslint-disable-next-line no-empty
    } catch {}

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
            eventTitle: "General Gameplay",
            eventID: eventID,
            messageID: undefined,
            playerLimit: 32
        };

        if(skip > 0) {
            skip--;
            event.cancelledStatus = "Too soon to gauge interest";
        }

        newEvents.push(event);
    }

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
            entry.push(event);
        }
    });
    const eventsByDay: TF2Event[][] = Array.from(map.values());
    const embeds: {embed: MessageEmbed, events: TF2Event[]}[] = [];

    eventsByDay.forEach(day => {
        const dayTimeStamp = day[0].startTime; // We know it's sorted.
        const embed = new MessageEmbed();

        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        embed.setTitle(`${daysOfWeek[dayTimeStamp.getUTCDay()]} ${dayTimeStamp.getUTCFullYear()}/${dayTimeStamp.getUTCMonth() + 1}/${dayTimeStamp.getUTCDate()} (UTC)`);
        embed.setDescription("Use the reactions below to select when you would like to play Team Fortress 2.\n" + 
            "Numbers show how many users are available at that time, and how many players can play on the server. For live information scroll to the bottom of this channel.\n" +
            "Dates and times are in your time-zone unless specified.");

        if(Date.now() > dayTimeStamp.valueOf() && Math.abs(dayTimeStamp.valueOf() - Date.now()) < msInDay) {
            embed.setColor("YELLOW");
        } else {
            embed.setColor("DARK_ORANGE");
        }
        embed.setFooter(`Event IDs for this day: ${dayTimeStamp.valueOf()}-#\nSubstitute # for the appropriate letter.`);

        const fieldNames = ["A:", "B:", "C:", "D:", "E:", "F:", "G:", "H:", "I:", "J:", "K:", "L:"];

        day.forEach(event => {
            const start = event.startTime.valueOf() / 1000;
            const end = event.endTime.valueOf() / 1000;
            const name = fieldNames[Math.floor((event.startTime.valueOf() % msInDay) / eventDuration)] + " " + event.eventTitle;
            const playerCount = `${event.attendingUsers.length}/${event.playerLimit}`;

            let value = `<t:${start}:D>\n<t:${start}:t> to <t:${end}:t>\n${playerCount}`;

            if(event.cancelledStatus) {
                value = "Cancelled:\n" + event.cancelledStatus;
            } else if(event.startTime.valueOf() < Date.now() && event.endTime.valueOf() > Date.now()) {
                value = `**Happening now\nEnds <t:${end}:R>\n${playerCount}**`;
            } else if(event.startTime.valueOf() - Date.now() > 0 && event.startTime.valueOf() - Date.now() < 1 * msInHour) {
                value = `Starts <t:${start}:R>\n Ends at <t:${end}:t>\n${playerCount}`;
            } else if(event.endTime.valueOf() < Date.now()) {
                event.cancelledStatus = "Event completed";
                value = `<t:${end}:D>\nFinished at <t:${end}:t>`;
            }

            embed.addField(name, value, true);
        });
        embeds.push({embed: embed, events: day});
    });

    const channel = client.channels.resolve(scheduleChannel) as TextChannel | undefined;
    if(channel === undefined) throw new Error("Invalid TF2 Schedule channel");

    const infoString = channel.topic;
    if(infoString !== null) {
        const server = await Server({
            ip: "octo-gaming.tf2.host",
            port: 27015,
            timeout: 5000
        });
        const info = await server.getInfo();
        const playerCount = info.players.online;
        const maxPlayers = info.players.max;
        const infoEmbed = new MessageEmbed();
        infoEmbed.setTitle("Information:");
        infoEmbed.setDescription(infoString);
        infoEmbed.setColor("DARK_GOLD");
        infoEmbed.addField("TF2 Server Status:", "```" +
            `Players: ${playerCount}/${maxPlayers}\n` +
            `Map: ${info.map}` +
            (info.visibility === "private" ? "\nPASSWORD PROTECTED```" : "```"));
        embeds.push({embed: infoEmbed, events: []});
    }

    const modifiedEvents: TF2Event[] = [];

    for(const messageData of embeds) {
        const message = await channel.send({embeds: [messageData.embed]});
        const modifiedDay = messageData.events.map(e => {
            e.messageID = message.id;
            return e;
        });
        modifiedEvents.push(...modifiedDay);
    }

    return modifiedEvents;
}

function delay(date: Date) {
    const time = date.getTime() - Date.now();
    if(time <= 0) {
        return new Promise(resolve => setTimeout(resolve, 0));
    }
    return new Promise(resolve => setTimeout(resolve, time));
}
