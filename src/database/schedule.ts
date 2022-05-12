import { Guild, User } from "discord.js";
import { model, Schema, Model, Types} from "mongoose";
import { scheduledEvents } from "../utilities/scheduledEvents";
import { shopItems } from "../utilities/shop";
import { ShopItem } from "../utilities/shop";

// Scheduled Event Schema
interface ScheduledEvent {
    _id: string,
    user: string,
    guild: string,
    eventName: string,
    triggerTime: Date,
    error: boolean
}

const scheduledEventSchema = new Schema<ScheduledEvent>({
    _id: {type: String, _id: true},
    user: {type: String, required: true},
    guild: {type: String, required: true},
    eventName: {type: String, required: true},
    triggerTime: {type: Date, required: true},
    error: {type: Boolean, required: true, default: true}
}, {
    timestamps: {},
    collection: "ScheduledEvents",
    _id: false
});

const scheduledEvent: Model<ScheduledEvent> = model<ScheduledEvent>("ScheduledEvents", scheduledEventSchema, "ScheduledEvents");

export {scheduledEvent};

// NEVER call this function outside of /index.ts
export async function scheduleLoop() {
    // eslint-disable-next-line no-constant-condition
    while(true) {
        //console.log("Checking for scheduled events");
        const scheduledItems: Array<ScheduledEvent> = await scheduledEvent.find({});
        await scheduledItems.forEach(async (event) => {
            if(event.triggerTime.getTime() < Date.now()) {
                const err: string = await processScheduledEvent(event);
                if(err === "") {
                    console.log("Running scheduled event \"" + event.eventName + "\" for user " + event.user);
                    (await scheduledEvent.findByIdAndDelete(event._id));
                } else {
                    event.error = true;
                    console.log(err);
                    (await scheduledEvent.findByIdAndUpdate(event))?.save();
                }
            }
        });
        await delay(60);
    }
}

export async function createScheduledEvent(eventName: string, userID: string, guildID: string | undefined, triggerTime: Date): Promise<boolean> {

    const realGuildID: string = guildID ?? "";

    if(realGuildID === "") {
        return false;
    }
    
    const newEvent: ScheduledEvent = {
        _id: new Types.ObjectId().toHexString(),
        user: userID,
        guild: realGuildID,
        eventName: eventName,
        triggerTime: triggerTime,
        error: false
    };
    const dbNewEvent = new scheduledEvent(newEvent);
    await dbNewEvent.save();
    console.log("Event \"" + newEvent.eventName + "\" scheduled for user " + userID + " at " + newEvent.triggerTime);
    return true;
    // TODO: new mongoose.Types.ObjectId().toHexString() Use this in creation 
}

async function processScheduledEvent(event: ScheduledEvent): Promise<string> {
    const err = await scheduledEvents?.get(event.eventName)?.(event.user, event.guild) ?? "An unknown error occured trying to run a scheduled event";
    return err;
}

export async function getScheduledEvent(user: User, guild: Guild | null, eventName: string): Promise<ScheduledEvent | null> {
    const event = {
        user: user.id,
        guild: guild?.id ?? "",
        eventName: eventName
    };
    const dbEvent: ScheduledEvent | null = await scheduledEvent.findOne(event);
    return dbEvent;
}

function delay(sec: number) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}