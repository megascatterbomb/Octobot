import { IntegerType } from "@frasermcc/overcord";
import { exception } from "console";
import { User } from "discord.js";
import mongoose from "mongoose";
import assert from "node:assert";
import { threadId } from "worker_threads";
import { shopItems } from "../utilities/shop";
import { ShopItem } from "../utilities/types";
const Schema = mongoose.Schema;

// Scheduled Event Schema

const scheduledEventSchema = new Schema({
    user: {type: String, required: true},
    guild: {type: String, required: true},
    shopItem: {type: String, required: true},
    triggerTime: {type: Date, required: true},
    error: {type: Boolean, required: true, default: true}
}, {
    timestamps: {},
    collection: "ScheduledEvents"
});

const scheduledEvent = mongoose.model("ScheduledEvents", scheduledEventSchema, "ScheduledEvents");

export {scheduledEvent};

// NEVER call this function outside of /index.ts
export async function scheduleLoop() {
    while(true) {

        // check schedule for events to fire
        delay(60);
    }
}

export async function createScheduledEvent() {

}

async function processScheduledEvent(shopItemName: string) {
    const shopItem: ShopItem = shopItems.get(shopItemName);
}

function delay(sec: number) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}