// External Module
const express = require('express');
const storeRouter = express.Router();
const {getHomes,getBookings, getFavouriteList, getIndex, getHomeDetails, postAddToFavourites, postDeleteFavourite}=require("../controllers/storeController");

storeRouter.get("/",getIndex);
storeRouter.get("/homes",getHomes);
storeRouter.get("/store/bookings",getBookings);
storeRouter.get("/store/favourite-list",getFavouriteList);

storeRouter.get("/homes/:homeId",getHomeDetails);
storeRouter.post("/store/favourite-list",postAddToFavourites);
storeRouter.post("/store/delete-fav/:homeId",postDeleteFavourite);

module.exports = storeRouter;