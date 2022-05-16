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
    StringType,
} from "@frasermcc/overcord";
import { Message, User } from "discord.js";
import { isUint16Array } from "util/types";
import { completeTask, getAllTasks, getTask, Task } from "../../database/octoToDo";
import { getDiscordNameFromID } from "../../utilities/helpers";

@Alias("finishtask", "finish", "done", "markdone", "donetask")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
@Permit("ADMINISTRATOR")
@Described("Transfer funds to another user")
export default class FinishTaskCommand extends Command {
    @Argument({ type: new StringType(), description: "The type of task"})
        taskType!: string;

    @Argument({ type: new UserType(), description: "The user associated with the task", optional: true})
        user!: User;

    async execute(message: Message, client: Client) {
        let actualTaskName: string | undefined = undefined;
        for(const t of await getAllTasks()) {
            if(t.taskTitle.toLowerCase().startsWith(this.taskType.toLowerCase())) {
                actualTaskName = t.taskTitle;
                break;
            }
        }
        if(actualTaskName === undefined) {
            throw new Error("Failed to find a task with that name");
        }
        const tasks = await getAllTasks(actualTaskName);
        if(tasks.length === 1) {
            completeTask(tasks[0]);
            const displayName = await getDiscordNameFromID(tasks[0].user, client, message.guild);
            message.reply("Completed task `" + tasks[0].taskTitle + "` for `" + displayName + "`");
            return;
        }
        if(this.user === undefined) {
            throw new Error("There are multiple tasks of that type. Specify a user after the task name.");
        }
        const task = await getTask(actualTaskName, this.user);
        if(task === null) {
            throw new Error("Could not find a task that matches that type and user.");
        }
        const err = await completeTask(task);
        if(err !== "") {
            throw new Error(err);
        }
        const displayName = await getDiscordNameFromID(task.user, client, message.guild);
        message.reply("Completed task `" + task.taskTitle + "` for `" + displayName + "`");
    }
}