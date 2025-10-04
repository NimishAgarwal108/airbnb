// External Module
const express = require('express');
const hostRouter = express.Router();
const {getAddHome, postAddHome, getHostHome, getEditHome, postEditHome, postDeleteHome}=require("../controllers/hostController")



hostRouter.get("/add-home",getAddHome);
hostRouter.get("/host-home",getHostHome);
hostRouter.get("/edit-home/:homeId",getEditHome);
hostRouter.post("/add-home",postAddHome);
hostRouter.post("/edit-home",postEditHome);
hostRouter.post("/delete-home/:homeId",postDeleteHome);
 
 



module.exports= hostRouter;

