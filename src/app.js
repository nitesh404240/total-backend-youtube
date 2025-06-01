import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

/**
 * Enable Cross-Origin Resource Sharing (CORS)
 * 
 * This allows the server to accept requests from different origins (domains).
 * Here, CORS is configured to only allow requests from a specific origin 
 * defined in the environment variable `CORS_ORIGIN`.
 * 
 * `credentials: true` allows cookies to be sent in cross-origin requests.
 */
// app.use(cors({
//   origin: process.env.CORS_ORIGIN,
//   credentials: true
// }));

/**
 * Middleware to parse incoming JSON requests.
 * 
 * This allows the server to handle requests with a JSON body.
 * The `limit` option restricts the size of the JSON payload to prevent DoS attacks.
 */
// app.use(express.json({
//   limit: "16kb"
// }));

/**
 * Middleware to parse URL-encoded form data.
 * 
 * Useful when handling data submitted via HTML forms 
 * (Content-Type: application/x-www-form-urlencoded).
 * `extended: true` allows parsing of nested objects using the qs library.
 * `limit` restricts the size of the payload.
 * 
 * Example:
 *   password=Kartar@1234 ➝ password=Kartar%401234
 *   (URL-encoded data like spaces become %20, @ becomes %40, etc.)
 */
// app.use(express.urlencoded({
//   extended: true,
//   limit: "16kb"
// }));

/**
 * Serve static files from the "public" folder.
 * 
 * Any file placed in this folder will be accessible by clients directly via URL.
 * Common use cases include images, PDFs, HTML files, or frontend build output.
 * 
 * Example:
 *   public/logo.png ➝ http://yourdomain.com/logo.png
 */
// app.use(express.static("public"));

/**
 * Middleware to parse cookies in incoming requests.
 * 
 * This enables reading cookies sent by the client in requests.
 * Useful for managing sessions, tokens, and authentication data.
 */
app.use(cors({origin: process.env.CORS_ORIGIN, credentials: true}));
app.use(express.json({ limit: "16kb"}));
app.use(express.urlencoded({ extended: true,limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

//routes import now 

import userRouter from "./routes/user_routes.js"

//routes declaration
//phle ham routes ko isme hi declrae kar de dete the ek hi file me 
//but abbhi files separate ho gyi hai to hame app.use ka use karna hoga

//this is the middleware 
//whene a person click on "/users"then controll goes to userRouter and i goes to 
// user_router file then it selcts on whcih page or route it wants to go
//app.use(route name , route or file to activate)


//at stating when application starts the api/v1/users the userRouter will get activate 
//then it will choose the router path and see what should happen on that route
//after that it sees post and get the function registeruser and got to ehte ifle registerUser an d
//on highorder function a function runs that gives the response message : ok 
app.use("/api/v1/users",userRouter)

//http://localhost:8000/api/v1/users/register

export { app };
