const favourite = require("../models/favourite");
const Home=require("../models/home");
const registeredHomes = [];



exports.getHomes=(req, res, next) => {
  const registeredHomes=Home.find().then(registeredHomes=> res.render('store/home-list', {registeredHomes: registeredHomes, pageTitle: 'airbnb Home',currentPage: 'Home',isLoggedIn:req.session.isLoggedIn,user:req.session.user}));
  console.log(registeredHomes);
}

exports.getIndex=(req, res, next) => {
  console.log('session value:',req.session);
  const registeredHomes=Home.find().then(registeredHomes=> res.render('store/index',
     {registeredHomes: registeredHomes,
     pageTitle: 'Homes List',
     currentPage: 'airbnb',
    isLoggedIn: req.session.isLoggedIn,
    user:req.session.user
}));
  console.log(registeredHomes);
}


exports.getBookings=(req, res, next) => { res.render('store/bookings', {registeredHomes: registeredHomes, 
  pageTitle: 'my bookings',
  currentPage: 'bookings',
isLoggedIn:req.session.isLoggedIn,
user:req.session.user});
}

exports.getFavouriteList=(req, res, next) => {
  favourite.find()
  .populate("homeId")
  .then(favourites=>{ 
    const favouriteHomes=favourites.map((favourite)=>favourite.homeId);
    res.render('store/favourite-list',
     {favouriteHomes: favouriteHomes,
     pageTitle: 'my favourites',
     currentPage: 'favourites',
     isLoggedIn:req.session.isLoggedIn,
     user:req.session.user
    });
  });
};

exports.getHomeDetails=(req, res, next) => {
   const homeId=req.params.homeId;
    Home.findById(homeId).then(home=>{
  if(!home){
    res.redirect("/homes");
  }
  else{
    res.render('store/home-detail',
     {
      home:home,
      pageTitle: 'home detail',
      currentPage: 'Home',
      isLoggedIn:req.session.isLoggedIn,
      user:req.session.user
    });
  }
  })

}

exports.postAddToFavourites=(req,res,next)=>{
  const homeId=req.body.id;
  favourite.findOne({homeId:homeId})
  .then(
    existingFav=>{
      if(existingFav){
        return  res.redirect("/store/favourite-list");
      }
      const fav=new favourite({homeId:homeId});
      return fav.save();
    }
  )
  .then(()=>{
    res.redirect("/store/favourite-list");
  })
  .catch(err=>{
    console.log('error while adding to favourites',err);

  })
};


exports.postDeleteFavourite = (req, res, next) => {
  const homeId=req.params.homeId;
   favourite.findOneAndDelete({homeId:homeId}).then (result=>{
   console.log('fav removed',result);
  }).catch(err=>{
    console.log('error while removing favourite',err);
  }).finally(()=>{
    res.redirect("/store/favourite-list");
  });
};


exports.registeredHomes = registeredHomes;
