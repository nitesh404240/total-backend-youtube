import mongoose from "mongoose"
import  jwt  from "jsonwebtoken"
import bcrypt from "bcrypt"
//direct encryption of password is not possible so we 
//will use the pre hook in mongodb that 
//act and pass a callback function on evry save and many more 
//steps like when u click save the password or picture it will got activate and takes time 
const userSchema = new mongoose.Schema(
    {

        username :{
            type :String,
            required : true,
            unique : true,
            lowercase : true,
            index: true,
            trim : true
        },
//When you insert a document, MongoDB automatically 
// generates a unique _id field of type ObjectId./it will save data by unique id 
        email:{
            type :String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true
        },
        fullname:{
            type :String,
            required : true,
            index: true,
            trim : true
        },
        avatar :{
            type : String, //it will take url from cloudnary
            required: true
        },
        coverImage :{
            type : String,

        },
        //in watch history there will be many video will passed ,
        //so we created an array for it
        watchHistory : [
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        password :{
            type : String,
            required :[true,"password is required"]
        },
        refreshTokens : {
            type : String
        },

}, {timestamps:true})

//It's a feature of Mongoose — the 
// ODM (Object Data Modeling) library for MongoDB.

// We can't encrypt the password directly, so we use Mongoose's pre-save hook.
// This hook runs automatically before every save operation.
// We use it to hash the password if (and only if) it's modified.
// This avoids re-hashing when updating other fields like email, avatar, or name.

//this is a part of middleware it will run before the data going to save
//hashing the password
//this middlware hashing the password in the database 
userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next();
    }
       this.password =await bcrypt.hash(this.password,10)
        next()
})
//in this below we can add our modifiesd or user based methods 
//like ispasswordcorrect it will compare the user password with the hashed password
//this.password will be mogodb password or presaved and password is the new passwor dto compre
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password , this.password)
}

//////The payload is the middle part of a JWT (JSON Web Token). It’s just a JavaScript object that contains data (claims) — like a user’s ID, email, roles, etc.

//whent the accesstoken got generated it dont know where it belongs to so we use these
//field like id,email,password,fullname to make where it belongs,

//it will return a expiry and code with their uder identity like email,id,password
userSchema.methods.generateAccessToken = async function() {
      return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,            //this is my payload  to identify and generate a random code
        fullname : this.fullname
      },
       process.env.ACCESS_TOKEN_SECRET,   //this will be my secret key that will help me to decode the token  //the secret is only known to the server 
      {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY   //this will be the expiry 
      }
    );
    //it will take my data to generate random code that can be exncrypt and takes the secr
}
// Define a method on the user schema to generate a refresh token
userSchema.methods.generateRefreshToken = async function () {

  // Return a signed JWT containing selected user data
  return jwt.sign(
    {
      // Add the user's unique MongoDB ID to the token payload
      _id: this._id,
    },

    // Use a secret key stored in your .env file to sign the token
    process.env.REFRESH_TOKEN_SECRET,

    {
      // Set how long the token is valid for (e.g., '7d' or '30m')
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
};


// Call the generateRefreshToken method to get a new refresh token
// const token = await user.generateRefreshToken(); // This returns a JWT string

// // Verify (decode and check signature) using the correct secret
// const decoded = jwt.verify(
//   token,                                // the JWT string to verify
//   process.env.REFRESH_TOKEN_SECRET      // use the same secret used to sign it
// );

// // Log the decoded payload
// console.log(decoded);                   // { _id, email, username, fullname, iat, exp }


export const User = mongoose.model("User",userSchema)