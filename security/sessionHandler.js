var debug = require('debug')('session'); // set DEBUG=session

var session = {
	create: function(req, user) {
				if (req.session) {
					req.session.reset();				
					req.session.user = {};
					req.session.user.username = user.username;
					req.session.user.name = user.name;					
					user.active = true;
					debug('Session created for user "%s".', user.username);
					//req.io.emit('message', {message: 'update'}); // Inform all connected clients.
				}
			},
			
	destroy: function(req) {
				if (req.session && req.session.user) {
					req.db.find('users', {username: req.session.user['username']}, function(user) {
						if (user) user.active = false;
						if (req && req.session) {
							debug('Session destroyed for user "%s".', req.session.user.username);
							req.session.reset();
							delete req.session.user;														
						}						
					});	
					req.io.emit('message', {message: 'update'}); // Inform all connected clients.
				}
				
			 }			 
};

module.exports = session;