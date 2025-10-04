const Home=require("../models/home");
const registeredHomes = [];

  exports.getAddHome=(req, res, next) => {
    res.render('host/edit-home', 
      {pageTitle: 'Add Home to airbnb',
        currentPage:'add-home',
      editing: false,
    isLoggedIn:req.session.isLoggedIn,
    user:req.session.user
  });
  }

exports.getHomes=(req, res, next) => {
  const registeredHomes=Home.find().then(registeredHomes=> res.render('store/home-list', {registeredHomes: registeredHomes, pageTitle: 'airbnb Home',currentPage: 'Home',user:req.session.user}));
  console.log(registeredHomes);
}


exports.postAddHome = (req, res, next) => {
  const{houseName,price,location,rating,photoUrl}=req.body;
  const home = new Home({
    houseName,
    price,
    location,
    rating,
    photoUrl});
  home.save().then(()=>{
    console.log('home saved successfully');
  });
  res.redirect('/host/host-home');
};

exports.getHostHome=(req, res, next) => {
  const registeredHomes=Home.find().then(registeredHomes=> res.render('host/host-home',
     {registeredHomes: registeredHomes,
     pageTitle: 'Host Home List',
     currentPage: 'host-home',
     user:req.session.user,
    isLoggedIn:req.session.isLoggedIn}));
  console.log(registeredHomes);
}

exports.getEditHome=(req, res, next) => {
  const homeId=req.params.homeId;
  const editing=req.query.editing==='true';

  Home.findById(homeId).then(home=>{
  if(!home){
    console.log("home not found for edting");
    return res.redirect("/host/host-home");
  }
  else
  {
    console.log(homeId,editing,home);
    res.render('host/edit-home', 
    { home:home,
      pageTitle: 'edit your home',
      currentPage:'host-home',
      editing:editing,
      user:req.session.user,
    isLoggedIn:req.session.isLoggedIn});
  }
  });
}

exports.postEditHome = (req, res, next) => {
  const{id,houseName,price,location,rating,photoUrl}=req.body;
  Home.findById(id).then((home)=>{
    home.houseName=houseName;
    home.price=price;
    home.location=location;
    home.rating=rating;
    home.photoUrl=photoUrl;
    home.save().then((result)=>{
      console.log("home updated",result);
    }).catch(err=>{
      console.log("error while updating",err);  
    })
    res.redirect('/host/host-home');
  }).catch(err=>{
      console.log("error while finding home",err);  
    });
};


exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;

  Home.findByIdAndDelete(homeId)
    .then(result => {
      console.log("Home deleted successfully");
      res.redirect('/host/host-home');
    })
    .catch(err => {
      console.error('Error deleting home:', err);
      res.redirect('/host/host-home');
    });
};


exports.registeredHomes = registeredHomes;

