////////     APPROACH - 1 (TRY-CATCH)  ////////

//this file will be going to wrap the connection of database file 
//and wrap the data into a single function that can be used everywhere
// const asynchandler = (fn) => {() =>{}}
//const asynchandler = () =>{}
//const asynchandler = (fn) => () =>{}

 //these upper are higherorder function that accepts the function
 //as a argument and return the function as output 
 

 //below the function is async and there will always be async
 //
 //this file is almost same in every production code which uses try and catch
 // const asynchandler = (fn) => async(req,res,next) =>{
//     try{
//         await fn(req,res,next)
//     }catch(error){
//         res.status(error.code || 500).json({
//             success : true,
//             message : error.message
//         })
//     }
// }


//////////   APPROACH - 2 .//////////

const asynchandler = (requestHandler) =>{
    return (req,res,next)=>{
        Promise
        .resolve(requestHandler(req,res,next))
        .catch((error)=>next(error))
    }
}
export {asynchandler}