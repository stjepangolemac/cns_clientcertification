	const crypto = require('crypto');
    
    (function (password, salt) {
        crypto.pbkdf2(password, salt, 200000, 20, 'sha256', function(err, hash){
            if (err) {
                // Error occurred during password verification
                debug(JSON.stringify(err));
                res.auth.params.response = 'error';						
            } else { 
                console.log(hash.toString('hex'));
            }            
        });    
    })('doe', 'salt3');
    
    	