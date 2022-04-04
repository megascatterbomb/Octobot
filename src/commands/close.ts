import {
    Alias,
    Inhibit,
    Permit,
    Command,
    Client,
    Described,
} from "@frasermcc/overcord";
import { Message } from "discord.js";
import { setShopOpen } from "./buy";

@Alias("close")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Permit("ADMINISTRATOR")
@Described("Closes the shop")
export default class CloseCommand extends Command {

    async execute(message: Message, client: Client) {
        console.log("Shop Closed"); 
        setShopOpen(false);
        message.reply("Shop has been closed");
    }
}