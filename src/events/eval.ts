import { Client, DiscordEvent } from "@frasermcc/overcord";
import { object } from "zod";
import { client } from "..";

const EvalEvent: DiscordEvent<"messageCreate"> = {
    callback: async (message) => {
        if(!message.content.startsWith("$eval ")) {
            return;
        }
        if(!client.isOwner(message.author.id)) {
            message.channel.send("You do not have permission to $eval");
            return;
        }
        const command = message.content.substring(6);
        try {
            const result = await eval(command) as string + "";
            await message.channel.send(result);
        } catch (err) {
            if(err instanceof Error) {
                // eslint-disable-next-line @typescript-eslint/ban-types
                message.channel.send("```" + (err as Error).stack + "```");
            } else {
                message.channel.send("```Unknown error occured```");
            }
        }
    },
    firesOn: "messageCreate",
};

export default EvalEvent;