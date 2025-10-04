// External Module
const express = require('express');
const hostRouter = express.Router();
const {getAddHome, postAddHome, getHostHome, getEditHome, postEditHome, postDeleteHome}=require("../controllers/hostController")


// hostRouter.js
hostRouter.get("/homes", getHostHome); // accessible at /host/homes
hostRouter.get("/add", getAddHome);   // /host/add
hostRouter.get("/edit/:homeId", getEditHome); // /host/edit/:homeId
hostRouter.post("/add", postAddHome);
hostRouter.post("/edit", postEditHome);
hostRouter.post("/delete/:homeId", postDeleteHome);

 



module.exports= hostRouter;

