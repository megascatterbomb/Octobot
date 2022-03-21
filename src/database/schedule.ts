import { Guild } from "discord.js";
import { model, Schema, Model, Types} from "mongoose";
import { shopItems } from "../utilities/shop";

// Scheduled Event Schema
interface ScheduledEvent {
    _id: string,
    user: string,
    guild: string,
    shopItem: string,
    triggerTime: Date,
    error: boolean
}

const scheduledEventSchema = new Schema<ScheduledEvent>({
    _id: {type: String, _id: true},
    user: {type: String, required: true},
    guild: {type: String, required: true},
    shopItem: {type: String, required: true},
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
    while(true) {
        const scheduledItems: Array<ScheduledEvent> = await scheduledEvent.find({});
        await scheduledItems.forEach(async (event) => {
            if(event.triggerTime.getTime() < Date.now()) {
                if(await processScheduledEvent(event)) {
                    await scheduledEvent.findByIdAndDelete(event._id);
                } else {
                    event.error = true;
                    await scheduledEvent.findByIdAndUpdate(event);
                }
            }
        });

        delay(60);
    }
}

export async function createScheduledEvent(shopItem: string, userID: string, guildID: string | undefined, triggerTime: Date): Promise<boolean> {

    const realGuildID: string = guildID ?? "";

    if(realGuildID === "") {
        return false;
    }
    
    const newEvent: ScheduledEvent = {
        _id: new Types.ObjectId().toHexString(),
        user: userID,
        guild: realGuildID,
        shopItem: shopItem,
        triggerTime: triggerTime,
        error: false
    }
    const dbNewEvent = new scheduledEvent(newEvent);
    await dbNewEvent.save();
    return true;
    // TODO: new mongoose.Types.ObjectId().toHexString() Use this in creation 
}

async function processScheduledEvent(event: ScheduledEvent): Promise<boolean> {
    if(shopItems === null || shopItems.get(event.shopItem) === null) {
        return false;
    }
    return await shopItems?.get(event.shopItem)?.scheduledEvent?.(event.user, event.guild) ?? false;
}

function delay(sec: number) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}