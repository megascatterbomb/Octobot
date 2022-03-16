import { Client } from "@frasermcc/overcord";
import { Intents } from "discord.js";
import path from "path";
require('dotenv').config();

(async () => {
    const client = new Client({defaultCommandPrefix: "$", owners: ["193950601271443456"], intents: [Intents.resolve(32767)]});
    await client.registry.recursivelyRegisterCommands(path.join(__dirname, "/commands"));
    await client.registry.recursivelyRegisterEvents(path.join(__dirname, "/events"));
    const key: string = process.env.DISCORD_TOKEN ?? "invalid key";
    client.login(key);
})();