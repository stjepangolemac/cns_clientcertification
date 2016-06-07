const express = require('express'),
      router = express.Router(),
      debug = require('debug')('api'); 

router.get('/add/:id', function(req, res) {            
    res.json({ add: req.params.id });
});

router.get('/delete/:id', function(req, res) {            
    res.json({ delete: req.params.id });
});

module.exports = router;