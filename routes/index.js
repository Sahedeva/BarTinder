var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var config = require('../config');
var jwt = require('jsonwebtoken');
var User = require('../models/user'); // get our mongoose model
var Venue = require('../models/venue');
var Token = require('../models/token');
var mongoose = require('mongoose');
var venue_response = "";
var current_venue = 0;
var random_array = [0];
var login_response = "";
var current_venue_array = [0];
var position = 0;
var count = 0;
var rand_array = [0];
var rand_num;
var venues_global = [];

Venue.find({}, function(err, venues) {
  venues_global=venues;
});


/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('index', { title: 'Bartinder' });

});

router.get('/clicker', function(req, res, next) {
  var test = req.headers.cookie;
  if (test){
    console.log("test: " + test.substring(11));
    var token = test.substring(11);
    Token.findOne({'token': token}, function(err, tokens){
      if (tokens){
        User.findOne({'_id': tokens['user_id']}, function(err, users) {
          Venue.findOne({'_id': users['venue_id']}, function(err, venues){
            login_response = "Authorized for "+venues['name'];
            var name = venues['name'];
            var venue_id = venues['_id'];
            var patron_number = venues['patron_number'];
            var comment = venues['comment'];
            res.render('clicker', {name: name, venue_id: venue_id, patron_number: patron_number, comment: comment});
          });
        });
      } else {
        login_response = "Login failed";
        console.log(login_response);
        res.redirect('/login');
      }
    });  
  } else {
    login_response = "Login failed";
    console.log(login_response);
    res.redirect('/login');
  }
});

router.post('/tracked', function(req, res, next){
  var access_token = req.body.access_token;
  var patron_number = req.body.counter1;
  var comment = req.body.comment;
  var venue_id = req.body.venue_id;
  var updated_at = Math.floor(Date.now() / 1000);
  Venue.findOneAndUpdate({'_id': venue_id}, {patron_number: patron_number, comment: comment, updated_at: updated_at}, {new: true}, function(err, venue) {
    res.redirect('/clicker');
    if (err) {
      console.log('got an error');
    }
  });
});

router.get('/setup', function(req, res) {

  // create a sample user
  var john = new User({
    name: 'Why',
    password: 'word',
    admin: true
  });

  // save the sample user
  john.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true });
  });
});

router.get('/register', function(req, res, next) {
  var venue_id = [];
  var venue_name = [];
  Venue.find({}, function(err, venues) {
    for (var i = 0; i<venues.length; i++) {
      venue_name[i] = venues[i]['name'];
      venue_id[i] = venues[i]['_id'];
    }
  res.render('register', {title: 'Registration', venue_name: venue_name, venue_id: venue_id}); 
  });
});

router.post('/new_user', function(req,res,next){
	var name = req.body.name;
	var password = req.body.password;
	var admin = true;
  var venue_id = req.body.venues;
  var new_user = new User({
    name: name, 
    password: password, 
    admin: admin,
    venue_id: venue_id
  });

  new_user.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');

  });
  res.redirect('/login');
});


router.get('/login', function(req, res, next) {
	res.render('login', {title: 'Login', login_response: login_response});
});

router.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

router.post('/wasVenueUpdated', function(req, res) {
  var venue_id = req.body.venue_id;
  console.log(venue_id);
  Venue.findOne({'_id': venue_id}, function(err, venue){
      console.log(venue['updated_at'].getTime());
      var timestamp = venue['updated_at'].getTime();
      console.log(timestamp);
      res.json({ timestamp: timestamp});
  });
});

router.post('/authenticate', function(req, res) {
	var name = req.body.name;
	var password = req.body.password;

  User.findOne({
    name: name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    }
    else if (user) {

      bcrypt.compare(password, user.password, function(err, result) {
        if (!result) {
          res.json({ success: false, message: 'Authentication failed. Wrong password.' });
        }
        else {
          // if user is found and password is right
          // create a token
          var token = jwt.sign(user, config.secret, {
            expiresInMinutes: 1440 // expires in 24 hours
          });

          // return the information including token as JSON
          var user_id = user['_id'];
          var new_token = new Token({
            token: token,
            user_id: user_id
          });
          new_token.save(function(err) {
            if (err) throw err;

            console.log('Token saved successfully');

          });
          res.json({
            success: true,
            message: 'Enjoy your token!',
            token: token
          });
        }
      });

    }
  });

});
// Home route will be hard coded to start at index 0
// this will allow a starting point to set up back button
router.get('/home', function(req,res) {
  Venue.find({}, function(err, venues){
    venue = venues[current_venue];
    console.log(venue);
    res.render('home', {current_venue: current_venue});
  });
});

// Go forward or back along venue array
  //Forward: if at end of array(caps at 4) then get random venue and shift array forward
  //Backward: if at beginning of array stay there
  router.post('/home_arrows', function(req, res) {
    var direction = req.body.arrow;
    current_venue = parseInt(direction.substring(1));
    if (direction[0] === "f"){
      position++
      if (position < current_venue_array.length) {
        current_venue = current_venue_array[position];
      }
      else {
      // Venue.find({}, function(err, venues) {
      // Get back a random variable from the database so you can display on page
      // var rand_gen = function(){
      //   var rand_num = Math.floor(Math.random()*venues.length);
      //   for (var i = 0; i<random_array.length; i++){
      //     if (rand_num == random_array[i]){
      //       continue;
      //     }
      //     else {
      //       random_array.push(rand_num);
      //     }
      //   }
      // }

      // while 

      // if (count == )
      
      // if (rand_num == current_venue) {
      //   rand_num = Math.floor(Math.random()*venues.length);
      // } else if (rand_num == current_venue) {
      //   rand_num = Math.floor(Math.random()*venues.length);
      // }
      // var rand_num = Math.floor(Math.random()*venues.length);
      var repeat= true;

      while (repeat)
      {
        rand_num = Math.floor(Math.random()*venues_global.length); 

        for(var i=0; i<=count; i++)
        {
          if (rand_array[i] == rand_num)
          {
            repeat=true;
            break;
          }
          else 
            repeat=false;
        }

        if(repeat)
          continue;
      }

      rand_array[count]=rand_num;
      count++;


      if (rand_array.length == venues_global.length){
        rand_array = [];
        count=0;
      }
      console.log(rand_array);
      current_venue = rand_num;
      current_venue_array.push(current_venue);
      // });
if (position > 4) {
  position = 4;
  current_venue_array.shift();
}
}
}
else {
  position--
  if (position < 0){
    position = 0;
  }
  current_venue = current_venue_array[position];
}
res.redirect('/home');
});


router.post('/back', function(req, res, next){
  var current = req.body.back;
});

router.get('/new', function(req, res, next) {
	res.render('new', {title: 'New Venue', venue_response: venue_response});
});


router.post('/new_venue', function(req,res,next){
	var name = req.body.name;
	var location = req.body.location;
	var hours = req.body.hours;
	var logo_url = req.body.logo_url;
	var website_url = req.body.website_url;
	var capacity = req.body.capacity;
	var patron_number = req.body.patron_number;
	var comment = req.body.comment;
  var updated_at = Math.floor(Date.now() / 1000);
	Venue.find({}, function(err, venue){
		Venue.collection.insert({name: name, location: location, hours: hours, logo_url: logo_url, website_url: website_url, capacity: capacity, patron_number: patron_number, comment: comment, updated_at: updated_at});
		venue_response = "You successfully added a venue to the database!";
		res.redirect('/new');
	});
});





module.exports = router;