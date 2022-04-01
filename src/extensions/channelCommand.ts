import { Client, Command } from "@frasermcc/overcord";
import { Message } from "discord.js";
import { allowedChannels } from "../utilities/types";

export default abstract class ChannelCommand extends Command {
    protected async customCommandBlocker(message: Message, client: Client): Promise<{
        shouldBlock: boolean;
        msg?: string;
    }> {
        if(allowedChannels.includes(message.channelId) || message.member?.permissions.has("ADMINISTRATOR")) {
            return {shouldBlock: false};
        }
        return {shouldBlock: true, msg: "You cannot use Octobot in this channel. Use <#957061767920513164> instead"};
    }
}