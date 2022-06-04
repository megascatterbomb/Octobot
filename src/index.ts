import { Client } from "@frasermcc/overcord";
import { Intents, TextChannel } from "discord.js";
import connectToDatabase from "./database/mongo";
import path from "path";
import { scheduleLoop } from "./database/schedule";
import { lotteryLoop } from "./database/lottery";
import { taxLoop } from "./events/tax";
import { allowedChannels } from "./utilities/config";
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

export let client: Client;

(async () => {
    client = new Client({defaultCommandPrefix: "$", owners: ["193950601271443456"], intents: [Intents.resolve(32767)]});
    await client.registry.recursivelyRegisterCommands(path.join(__dirname, "/commands"));
    await client.registry.recursivelyRegisterEvents(path.join(__dirname, "/events"));

    await connectToDatabase();

    const key: string = process.env.DISCORD_TOKEN ?? "invalid key";
    await client.login(key);
    console.log("Connected to Discord");
    const channel = client.channels.cache.get(allowedChannels[0]) as TextChannel | undefined;
    channel?.send("Octobot launched successfully.");
    scheduleLoop();
    lotteryLoop();
    taxLoop();
})();