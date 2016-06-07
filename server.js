const http = require('http');

const PORT = 8080;

const server = http.createServer(function(req, res){
    console.log(req.method + '' + req.url);
    res.end('Hello client!');
}).listen(PORT || 8080);

console.log("Server ruunning on port" + server.address().port);