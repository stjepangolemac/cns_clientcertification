const express = require('express'),
	  login = require('./login');
      debug = require('debug')('auth');

// Extend the request object with 'auth' property. 
// We use 'auth' property to pass authentication-related 
// info to the the main router.
express.request.auth = {};
express.request.auth.params = {};

const router = express.Router();

/**
 * This function validates authentiticy of each request.
 **/      
var isAuthenticated = function(req, res, next) {

	// If a session exists, check if it is still active.
	if (req.session && req.session.user) {

        // Validate the session (e.g., the token could be compromised and hence invalidated).
		req.db.find('users', {username: req.session.user.username}, function(user) {				
			if ( Object.keys(user).length > 0 && user.active ) {
				debug('Authenticated user "%s"', user.username);	
				req.auth.params = {
					response: 'active',
					message: ''														
				};
			} else {
				debug('Session for user "%s" not active.', user.username);
				debug('Certificate: ' +  req.socket.cert);
				//req.sessionHandler.destroy(req);               		
				req.auth.params = { 
					response: 'login',
					message: 'Please enter your login credentials.'														
				};					
            }	
			return next();					
		});		
    // Session does not exist.
    // If a certificate exists, check users for serial and proceed to login
	} else if(req.connection.getPeerCertificate(true).serialNumber) {
        req.db.find('users', {serial: req.connection.getPeerCertificate(true).serialNumber}, function(user) {
            if ( Object.keys(user).length > 0 ) {
                debug('User has valid cert "%s"', user.username);
                req.auth.params = {
                    response: 'login',
                    message: 'Certificate is valid for user ' + user.username,
                    user: user
                };
            } else {
                debug(req.connection.getPeerCertificate(true).serialNumber);
                debug('Session for user "%s" not active.', user.username);
                debug('Certificate: ' +  req.socket.cert);
                //req.sessionHandler.destroy(req);
                req.auth.params = {
                    response: 'login',
                    message: 'Please enter your login credentials.'
                };
            }
            return next();
        });
    }
    else
    {
		debug("Session does not exist (user not authenticated).");
		req.auth.params = {
			response: 'login',
			message: 'Please enter your login credentials.'														
		};        	
		return next();
	}		
};

/**
 * Simple logout handler.
 */
var logout = function(req, res) {
	debug("Logging out...");
	req.sessionHandler.destroy(req);
	return res.redirect('/');    
};

/**
 * This middleware handles different states resulting 
 * after the authentication middleware.
 */
var generateResponse = function (req, res, next) {
    debug(req.auth.params);
	var responses = {
			'error': function() {
				res.locals = {
					title: "Error",
					message: "Sorry, your request cannot be processed." 
				};                        
				return res.render('error');                                        
			},
			'login': function() {
				if(req.auth.params.user) {
                    res.locals = {
                        message: req.auth.params.message,
                        usr: req.auth.params.user.username
                    };
                } else {
                    res.locals = {
                        message: req.auth.params.message
                    };
                }
				return res.render('login');				
			},
			'success': function() {
				// Create a new session cookie for the authenticated user. 
				// (Optionally, we can store user's roles and perms in the protected cookie 
				// -- this is similar to security tokens in regular OSs).
				req.sessionHandler.create(req, req.auth.params.user);
                req.auth.params = {};
				req.io.emit('message', {message: 'update'}); // Inform all connected clients.             
				return res.redirect('/');                                       			
			},
			'active': function() {
				next();  
			}                  
	};
	return responses[req.auth.params.response]();
};


router.use(isAuthenticated);
router.post('/login', login); // Handle explicit '/login' requests.
router.all('/logout', logout); // Handle explicit '/logout' requests.
router.use(generateResponse); // Generate appropriate responses.

module.exports = router;