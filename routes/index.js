const express = require('express'),
      router = express.Router(),
      debug = require('debug')('index'),
      api = require('./api'); 


router.get('/', function(req, res) {            
      // Retrieve full name and bio for this user.
      req.db.find('users', {username: req.session.user.username}, function(user) {
            res.locals = { 
                  user: user['name'],	  		    		
                  bio: user['bio'],
                  headers: req.db.get('headers'), 
                  users: req.db.get('users')
            };       
            return res.render('index');             	
      });              
});

router.use('/api', api);

module.exports = router;