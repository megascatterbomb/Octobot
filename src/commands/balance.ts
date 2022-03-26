import {
    Alias,
    Inhibit,
    Command,
    Argument,
    Client,
    UserType,
    Described,
} from "@frasermcc/overcord";
import { Message, User } from "discord.js";
import { getUserBalance } from "../database/octobuckBalance";
import { getDiscordName } from "../utilities/helpers";
import ChannelCommand from "../extensions/channelCommand";

@Alias("balance", "bal", "money")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Get the balance of a user")
export default class BalanceCommand extends ChannelCommand {
    @Argument({ type: new UserType() , optional: true, description: "The user whos balance to return. Leave blank to check your own"})
        user!: User;
    
    async execute(message: Message, client: Client) {
        const user: User = this.user ?? message.author;
        if(user.bot) {
            message.channel.send("Could not find the balance of that user (bots cannot have a balance)");
            return;
        }
        const displayName: string = await getDiscordName(user, message, client);

        const balance = await getUserBalance(user);

        if(balance === null && await message.guild?.members.fetch(user)) {
            message.channel.send("Could not find the balance of that user (they do not have a balance)");
            return;
        } else if (balance === null) {
            message.channel.send("Could not find the balance of that user (they are not in the server)");
            return;
        }

        message.channel.send("Balance of " + displayName + ": $" + balance);
    }
}