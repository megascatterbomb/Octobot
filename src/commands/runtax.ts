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
} from "@frasermcc/overcord";
import { Message, TextChannel } from "discord.js";
import { fileTaxes, generateTaxReport } from "../events/tax";
import ChannelCommand from "../extensions/channelCommand";
import { allowedChannels, logChannel } from "../utilities/types";

@Alias("filetax", "runtax")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Permit("ADMINISTRATOR")
@Described("File taxes")
export default class FileTaxCommmand extends ChannelCommand {
    @Argument({ type: new StringType(), description: "Confirmation", infinite: true})
        confirmation!: string[];

    async execute(message: Message, client: Client) {
        if(this.confirmation === undefined || this.confirmation.join(" ") !== "Yes, do as I say!") {
            message.reply("Type `$filetax Yes, do as I say!` if you *really* want to manually tax the population.");
            return;
        }
        message.reply("Filing taxes...");
        const taxes = await fileTaxes();
        message.reply({embeds: [await generateTaxReport(taxes)]});
        (client.channels.cache.get(logChannel) as TextChannel)?.send({embeds: [await generateTaxReport(taxes)]});
    }
}