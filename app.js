const debug = require('debug')('app'),
      express = require('express'),
      hbs = require('hbs'),
      bodyParser = require('body-parser'),
      auth = require('./security/auth'),
	  login = require('./security/login'),
      index = require('./routes/index'),
      db = require('./data/DB'),
      sessionCookie = require('client-sessions'),	
	  sessionHandler = require('./security/sessionHandler.js'),
	  io = require('socket.io')(),
	  http = require('http'),
	  https = require('https'),
	  path = require('path'),
	  fs = require('fs');

const app = express();

const PORT = 443;

//const options = {key: '', cert: ''};


// View engine setup.
app.set('views', __dirname + '/views');
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');

// Make some objects accessible via the req object.
app.use(function(req, res, next){
	req.db = db;
	req.sessionHandler = sessionHandler;
	req.io = io;
	next();
});

/***************************************
 *  BEGIN middleware and routers
 ***************************************/ 
// Log requests and handle favicon requests.
app.use(function(req, res, next){
	debug(req.method + ' ' + req.url);
    //debug(req.connection.getPeerCertificate(true));
	if (req.url === '/favicon.ico') {
		res.writeHead(200, {'Content-Type': 'image/x-icon'} );
		res.end();
		return;
	}	
	next();
});

// To be able to parse POST-ed data.
app.use(bodyParser.urlencoded({ extended: false }));

// Handles clients sessions (missing XSS CSRF protection)
app.use(sessionCookie({
	cookieName: 'session',
	secret: '3y-UnbreakaB1e_Secre7',
	duration: 5 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
	httpOnly: true,
	secure: false, // 'true' - sent only via TLS/SSL
	ephemeral: true	  
}));

// Authenticate every request for every route.
// Also, handle explicit '/login' and '/logout' requests.
app.use(auth);

// Routing after a successful authentication.
// We can mount this router on an arbitrary path.
app.use('/', index);

// Points to static resources such as css and js files.
app.use(express.static(__dirname + '/public'));

// Resource not found (404 error).
app.use(function(req, res){  		
	res.locals = {
		title: "Error 404",
		message: "Requested resource not found." 
	};      
	return res.render('error');     
});

// Something went terribly wrong.
app.use(function(err, req, res, next){ 
	res.locals = {
		title: "Error",
		message: "Sorry, your request cannot be processed." 
	};      
    res.status(500).render('error');      

	req.sessionHandler.destroy(req);
    debug(err);
		
});
/***************************************
 *  END middleware and routers 
 ***************************************/
	 
const options = {
	key: fs.readFileSync(path.join('./certs/server/server-key.pem')),
	cert: fs.readFileSync(path.join('./certs/server/server.pem')),
    ca: fs.readFileSync(path.join('./certs/server/myca.pem')),
    requestCert: true,
    rejectUnauthorized: false
};

const httpsServer = https.createServer(options, app, function (req, res) {

}).listen(PORT || 443);
debug('Server listening on port: ' + PORT);

// Websocket
io.listen(httpsServer);

//Start https server

httpsServer.on('error', function(error) {
	debug(error);
});

//Start websocket server
io.listen(httpsServer);
