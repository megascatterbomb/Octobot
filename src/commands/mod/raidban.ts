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
import { EndRaid, raidTriggered } from "../../events/antiRaid";
import { raidNotificationChannel } from "../../utilities/config";

@Alias("raidban")
@Permit("BAN_MEMBERS")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Described("Ban users involved in a raid")
export default class RaidBanCommand extends Command {

    async execute(message: Message, client: Client) {
        if(!raidTriggered) {
            message.reply("No raid in progress");
            return;
        }
        const raiders = EndRaid();
        raiders.forEach(r => {
            try {
                r.ban();
            // eslint-disable-next-line no-empty
            } catch {}
        });
        message.reply("Banned " + raiders.length + " users from server.");
        if(message.channelId !== raidNotificationChannel) {
            const channel = message.guild?.channels.cache.get(raidNotificationChannel) as TextChannel;
            channel.send("Banned " + raiders.length + " users from server.");
        }
    }
}