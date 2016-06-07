const debug = require('debug')('login'),
      crypto = require('crypto');

/**
 * Handles explicit '/login' requests.
 **/
var checkCredentials = function(req, res, next) {
	debug("User's credentials: %s", JSON.stringify(req.body));	
	if (req.body.username && req.body.password) {
		// Verify username and password
		checkUsername(req, next).then(checkPassword);							      
	} else {
		debug("Missing username or/and password.");		   
		req.auth.params = {
			response: 'login',
			message: 'Invalid user name or password.'	
		};       	
		return next();		     
	}		
};

function checkUsername(req, next) {	
	return {
		then: function(callback) {
			req.db.find('users', {username: req.body.username}, function(user) {								
				if ( Object.keys(user || {}).length > 0 ) {
					// Username valid		
					debug('Valid username: "%s"', req.body.username);
					// Attach 'user' to 'req' object and verify his/her password
					req.auth.params.user = user;
					process.nextTick(function() {						
						callback(req, next);
					});
				} else {
					debug('Invalid username: "%s"', req.body.username);										
					// Invalid username, login again 
					req.auth.params = {
						response: 'login',
						message: 'Invalid user name or password.'	
					};       	
					return next();									
				}
			});
		}
	}
}

function checkPassword(req, next) {
	crypto.pbkdf2(req.body.password, req.auth.params.user.salt, 200000, 20, 'sha256', function(err, hash){
		if (err) {			
			debug(JSON.stringify(err));
			res.auth.params.response = 'error';						
		} else { 
			var user = req.auth.params.user;						
			if ( comparePwdHash(hash.toString('hex'), user.password) ){	
				debug('User "%s" authenticated.', user.username);				
				// Password successfully verified
				req.auth.params.response = 'success';       																	
			} else {
				// Incorrect password, login again
				debug("Invalid password for user '%s'.", user.username);
				req.auth.params = {
					response: 'login',
					message: 'Invalid user name or password.'	
				};											
			}
			user = null;			
		}
		return next();
	});			
}

//Secure pwd hash comparison
function comparePwdHash(str1, str2) {
	var len;
	if ( typeof str1 === 'undefined' || 
		 typeof str2 === 'undefined' ||
		 (len = str1.length) !== str2.length) return 0;
	
	var t = 0;
	for (var i=0; i<len; i++) {
		t = t + ( str1.charCodeAt(i)^str2.charCodeAt(i) );
	}
	return (t > 0) ? 0 : 1;
}

module.exports = checkCredentials;