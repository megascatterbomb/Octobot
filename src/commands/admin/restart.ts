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
    UserType,
    Described,
    OwnerOnly,
} from "@frasermcc/overcord";
import { Message, User } from "discord.js";
import { addBalance, registerBalance, setBalance } from "../../database/octobuckBalance";
import { activeTraps } from "../../events/randomDrops";
import { getDiscordName } from "../../utilities/helpers";
import { setShopOpen } from "../buy";

@Alias("restart")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@OwnerOnly()
@Described("Shuts down the bot with exit code -1, forcing a restart")
export default class RestartCommand extends Command {

    async execute(message: Message, client: Client) {
        setShopOpen(false);
        client.user?.setPresence({status: "dnd"});
        const reply = await message.reply("Restarting in 5 seconds...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        while(activeTraps > 0) {
            await reply.edit("Waiting for active traps to resolve: " + activeTraps + " remaining...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        await reply.edit("Restarting...");
        client.user?.setPresence({status: "invisible"});
        process.exit(-1);
    }
}