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
    StringType,
    UserType,
} from "@frasermcc/overcord";
import { Message, User } from "discord.js";
import { getUserBalance } from "../database/octobuckBalance";

@Alias("balance", "bal", "money")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
export default class PingCommand extends Command {
    @Argument({ type: new UserType() , optional: true})
    user!: User;
    
    async execute(message: Message, client: Client) {
        const user: User = this.user === undefined ? message.author : this.user;

        if(user.bot) {
            message.channel.send("Could not find the balance of that user (bots cannot have a balance)");
            return;
        } 

        const displayName: string = await message.member?.nickname ?? message.author.username;
        let balance = null;
        try {
            balance = await getUserBalance(user.id);
        } catch {
            if(await message.guild?.members.fetch(user)) {
                message.channel.send("Could not find the balance of that user (they do not have a balance)");
            } else {
                message.channel.send("Could not find the balance of that user (they are not in the server)");
            }
            return;
        }
        message.channel.send("Balance of " + displayName + ": " + balance);
    }
}