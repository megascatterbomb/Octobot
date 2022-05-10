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
    StringType,
    UserType,
} from "@frasermcc/overcord";
import { Message, TextChannel, User } from "discord.js";
import { getUserBalance, getUserBalanceObject } from "../database/octobuckBalance";
import { calculateTax, fileTaxes, generateTaxReport } from "../events/tax";
import ChannelCommand from "../extensions/channelCommand";
import { getDiscordName } from "../utilities/helpers";
import { allowedChannels, logChannel } from "../utilities/config";

@Alias("tax")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Check owed taxes")
export default class FileTaxCommmand extends ChannelCommand {
    @Argument({ type: new UserType(), description: "User to check taxes of", optional: true})
        user?: User;

    async execute(message: Message, client: Client) {
        const user: User = this.user ?? message.author;
        if(user.bot) {
            message.channel.send("Could not find the taxes of that user (bots do not pay taxes)");
            return;
        }
    
        const displayName: string = await getDiscordName(user, message, client);
        const balanceObject = await getUserBalanceObject(user);
        const balance = balanceObject?.balance ?? null;

        if(balance === null && await message.guild?.members.fetch(user)) {
            message.channel.send("Taxes to be paid by " + displayName + ": $0");
            return;
        } else if (balance === null) {
            throw new Error("Could not find the taxes of that user (they are not in the server)");
        }
        const deduct = balanceObject?.taxDeductible ?? 0;
        const tax = await calculateTax(balance);

        const messageString = deduct === 0 ? ("Tax info for " + displayName + ":\n```Tax to be paid: $" + tax + "```") : 
            ("Tax info for " + displayName + ":\n```Base tax to be paid: $" + tax + "\nTotal deductibles: $" + deduct + 
            "\nActual tax to be paid: $" + Math.max(tax-deduct, 0) + "```");
        message.reply(messageString);
    }
}