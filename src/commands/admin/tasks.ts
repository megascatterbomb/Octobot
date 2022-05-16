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
import { EmbedField, EmbedFieldData, Message, MessageEmbed, User } from "discord.js";
import { addBalance, registerBalance, setBalance } from "../../database/octobuckBalance";
import { getAllTasks, Task } from "../../database/octoToDo";
import { activeTraps } from "../../events/randomDrops";
import { getDiscordName, getDiscordNameFromID } from "../../utilities/helpers";
import { setShopOpen } from "../buy";

@Alias("tasks")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Permit("ADMINISTRATOR")
@Described("Lists")
export default class TasksCommand extends Command {

    async execute(message: Message, client: Client) {
        const tasks: Task[] = await getAllTasks();
        if(tasks.length === 0) {
            message.reply("No tasks to complete.");
            return;
        }

        const embed: MessageEmbed = new MessageEmbed()
            .setColor(0xff8400)
            .setTitle("Octo GAMING To-do list")
            .setFooter({text: "Tasks can only be marked completed by a Gamer God."});

        const fields: EmbedFieldData[] = [];

        for(const t of tasks) {
            const displayName = await getDiscordNameFromID(t.user, client, message.guild);

            const field: EmbedFieldData = {
                name: t.taskTitle + "\nRequested by: `" + displayName + "`",
                value: t.taskDescription
            };
            fields.push(field);
        }
        // Sorts by task type, then by user, alphabetically
        fields.sort((a,b) => { // Need toLowerCase because uppercase is sorted before lowercase
            return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : b.name.toLowerCase() < a.name.toLowerCase() ? 1 : 0;
        });
        embed.setFields(fields);

        message.reply({embeds: [embed]});
    }
}