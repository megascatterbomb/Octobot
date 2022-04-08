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
} from "@frasermcc/overcord";
import { Message, User } from "discord.js";
import { addBalance, registerBalance, setBalance, transferFunds } from "../database/octobuckBalance";
import ChannelCommand from "../extensions/channelCommand";
import { getDiscordName } from "../utilities/helpers";

@Alias("send", "trade")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Transfer funds to another user")
export default class SendCommand extends ChannelCommand {
    @Argument({ type: new UserType(), description: "The user to send Octobucks to"})
        recipient!: User;

    @Argument({ type: new IntegerType(), description: "How many Octobucks to send"})
        amount!: number;

    async execute(message: Message, client: Client) {
        const displayName: string = await getDiscordName(this.recipient, message, client);
        const err: string = await transferFunds(message.author, this.recipient, this.amount);
        if(err !== "") {
            throw new Error(err);
        }
        await message.reply("Successfully sent $" + this.amount + " to " + displayName);
    }
}