const mongoose = require("mongoose");


const users = new mongoose.Schema({
    Id: {type: Number, required: true},
    firstName: {type:String, required:true},
    lastName: {type:String, required:true},
    userName: {type:String, required:true},
    email: {type:String, required:true},
    password: {type: Number, required: true}
},
{ _id: false }
)


module.exports = mongoose.model("Users", users);