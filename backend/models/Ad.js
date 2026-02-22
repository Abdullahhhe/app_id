const mongoose=require("mongoose");
const adSchema=new mongoose.Schema({
    title:String,
    mediaUrl:String,
    reward:Number
});
module.exports=mongoose.model("Ad",adSchema);