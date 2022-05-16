import { Guild, User } from "discord.js";
import mongoose from "mongoose";
import { model, Schema, Model, Types} from "mongoose";
import { scheduledEvents } from "../utilities/scheduledEvents";
import { shopItems } from "../utilities/shop";
import { ShopItem } from "../utilities/shop";

// Scheduled Event Schema
export interface Task {
    user: string,
    taskTitle: string,
    taskDescription: string,
    error: boolean
}

const taskSchema = new Schema<Task>({
    user: {type: String, required: true},
    taskTitle: {type: String, required: true},
    taskDescription: {type: String, required: true},
    error: {type: Boolean, required: true, default: true}
}, {
    timestamps: {},
    collection: "OctoToDoList",
});

const task: Model<Task> = model<Task>("OctoToDoList", taskSchema, "OctoToDoList");

export {task};

export async function createTask(taskTitle: string, taskDescription: string, userID: string): Promise<boolean> {
    const newTask: Task = {
        user: userID,
        taskTitle: taskTitle,
        taskDescription: taskDescription,
        error: false
    };
    const newTaskDB = new task(newTask);
    await newTaskDB.save();
    console.log("Task \"" + taskTitle + "\" added by user " + userID);
    return true;
    // TODO: new mongoose.Types.ObjectId().toHexString() Use this in creation 
}

export async function completeTask(t: Task): Promise<string> {
    await task.deleteOne(t);
    return "";
}

export async function getAllTasks(taskName?: string): Promise<Task[]> {
    const tasks: Task[] = taskName === undefined ? await task.find({}) : await task.find({taskTitle: taskName});
    return tasks;
}

export async function getTask(taskName: string, user: User): Promise<Task | null> {
    const taskToFind = {taskTitle: taskName, user: user.id};
    const taskResult: Task | null = await task.findOne(taskToFind);
    return taskResult;
}