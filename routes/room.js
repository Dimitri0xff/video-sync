var express = require('express');
var router = express.Router();


// Enter room
router.post('/', function(req, res, next) {
    res.render('room', { title: req.body.username });
});


// Redirect to login
router.use('/', function(req, res, next) {
    res.redirect('..');
});


module.exports = router;
