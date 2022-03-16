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

@Alias("balance", "bal", "money")
@Inhibit({ limitBy: "USER", maxUsesPerPeriod: 3, periodDuration: 10 })
export default class PingCommand extends Command {
    @Argument({ type: new UserType() , optional: true})
    user!: User;
    
    async execute(message: Message, client: Client) {
        message.channel.send(this.user === undefined ? message.author.id : this.user.id);
    }
}