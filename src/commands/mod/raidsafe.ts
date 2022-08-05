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
import { Message, TextChannel, User } from "discord.js";
import { EndRaid, MarkSafe, raidTriggered } from "../../events/antiRaid";
import { raidNotificationChannel } from "../../utilities/config";

@Alias("raidsafe")
@Permit("BAN_MEMBERS")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Mark a raid as not a raid")
export default class RaidSafeCommand extends Command {

    async execute(message: Message, client: Client) {
        if(!raidTriggered) {
            message.reply("No raid in progress");
            return;
        }
        EndRaid();
        MarkSafe();
        message.reply("Marked as not a raid");
        if(message.channelId !== raidNotificationChannel) {
            const channel = message.guild?.channels.cache.get(raidNotificationChannel) as TextChannel;
            channel.send("Raid marked as not a raid.");
        }
    }
}