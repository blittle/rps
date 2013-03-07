var mongo = require('mongojs'),
    _     = require('lodash');

var db = mongo.connect('rps', [
    "players",
    "games"
], function(err) {
    if(err) console.error("Error connecting to mongo!");
});


var players;

exports.index = function(req, res, next){
    db.players.find(function(error, found) {
        players = !error ? found : [];
        res.render('index', { title: 'Rock Paper Scissors!', players: players });
    });
};

exports.createPlayer = function(req, res, next) {

    var player = req.body;

    if(player.func.indexOf('Random') !== -1 || player.func.indexOf('Date') !== -1) {
        next({msg: "Cannot use Date or Random objects"});
        return;
    }

    db.players.save(player, function(err, saved) {
        if(err || !saved) {
            res.send({error: "cannot create player"});
        } else {
            res.send(req.body);
        }
    });
};

exports.startGame = function(req, res, next) {
    var player1temp = req.body.player1,
        player2temp = req.body.player2;

    var player1 =_.find(players, function(player) {
        player = JSON.parse(JSON.stringify(player));
        return player1temp === player._id;
    });

    var player2 = _.find(players, function(player) {
        player = JSON.parse(JSON.stringify(player));
        return player2temp === player._id;
    });

    var func1 = (new Function(player1.func))(),
        func2 = (new Function(player2.func))();

    var result1 = null,
        result2 = null,
        player1Wins = 0,
        player2Wins = 0;

    var temp1, temp2;

    for(var i = 0; i < 1000; i++) {

        temp1 = func1(result2);
        temp2 = func2(result1);

        result1 = temp1;
        result2 = temp2;

        if(result1 === result2) continue;

        switch(result1) {
            case 0:  // Rock
                if(result2 === 1) {
                    player2Wins++;
                } else if(result2 === 2) {
                    player1Wins++;
                }
                break;
            case 1:  // Paper
                if(result2 === 2) {
                    player2Wins++;
                } else if(result2 === 0) {
                    player1Wins++;
                }
                break;
            case 2:  // Scissors
                if(result2 === 0) {
                    player2Wins++;
                } else if(result2 === 1) {
                    player1Wins++;
                }
                break;
        }

    }

    res.send({
        player1: player1Wins,
        player2: player2Wins
    });
};

exports.getPlayers = function(req, res) {
    res.send(players);
};