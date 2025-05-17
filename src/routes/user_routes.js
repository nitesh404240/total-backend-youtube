import { Router } from "express";
import { registerUser } from "../controllers/user_controller.js";
const router = Router();

router.route("/register").post(registerUser)
// router.route("/register").post((req,res)=>{
//     res.status(200).json({
//         messsage : "ok"
//     })
// })


export default router

//=============  WITHOUT ASYNCHANDLER FUNCITON THE CODE WOULD BE LIKE THIS FOR EVERY ROUTE=======

// router.post("/register", async (req, res, next) => {
//   try {
//     // Some asynchronous logic here (e.g., DB call)
//     res.status(201).json({ message: "User registered" });
//   } catch (error) {
//     next(error); // Manually passing error to the next middleware
//   }
// });
