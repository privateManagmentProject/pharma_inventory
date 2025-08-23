import bcrypt from "bcrypt";
import User from "./models/User.js";
import connectDB from "./db/connection.js";


const register = async () =>{
    try {
        connectDB();
        const hashPassword = await bcrypt.hash("admin", 10);
        const newUser = new User({
            name: "admin",
            email: "admin@gmaill.com",
            password: hashPassword,
            address: "admin address",
            role: "admin"
        })
        await newUser.save();
        console.log("admin was created success");

    } catch(error) {
        console.log(error);
    }
}
register();
