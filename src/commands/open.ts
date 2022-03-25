import {
    Alias,
    Inhibit,
    Permit,
    Command,
    Argument,
    BooleanType,
    IntegerType,
    UnionType,
    FloatType,
    Client,
    Described,
} from "@frasermcc/overcord";
import { Message } from "discord.js";
import { setShopOpen } from "./buy";

@Alias("open")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Permit("ADMINISTRATOR")
@Described("Opens the shop")
export default class OpenCommand extends Command {

    async execute(message: Message, client: Client) {
        console.log("Shop Opened"); 
        setShopOpen(true);
        message.channel.send("Shop has been opened!");
    }
}