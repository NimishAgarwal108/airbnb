const mongoose=require("mongoose");

const userSchema= new mongoose.Schema({

  firstname:{
   type:String,
   required:[true,'first name is required']
  },
  lastname:{
   type:String,
   required:[true,'last name is required']
  },
  email:{
   type:String,
   required:[true,'email name is required'],
   unique:true
  },
  password:{
   type:String,
   required:[true,'password is required']
  },
  userType:{
    type:String,
    enum:['guest','host'],
    default:'guest'
  }







  });


module.exports=mongoose.model('User',userSchema);