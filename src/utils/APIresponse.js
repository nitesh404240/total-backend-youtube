
class APIResponse{
    //this is unique respnse for every api call that it will return 
    //a status coed ,message and data 
    constructor(statusCode,data,message = "Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode<400

        //status code are the measures to give the reesponse that what type of there is error and it can be 
        //used for many purpose like 
        //information response it will be between  to 100-199
        //for successful response it will be between 200 to 299
        //for client error it will be 400-499
        //server error it could be 500-599
        if (!this.success) {
            this.error = error || message;
        }
    }
}
export {APIResponse}

//example for this that what it gert during an api call
// import { APIResponse } from "./APIResponse.js";

// app.get("/user/:id", async (req, res) => {
//     try {
//         const user = await getUserById(req.params.id);
//         if (!user) {
//             return res.status(404).json(APIResponse.error("User not found", 404));
//         }
//         return res.status(200).json(APIResponse.success(user, "User fetched"));
//     } catch (err) {
//         return res.status(500).json(APIResponse.error("Internal server error", 500, err.message));
//     }
// });