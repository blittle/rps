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
    var player1 = req.body.player1,
        player2 = req.body.player2;

    var playersToPlay =_.filter(players, function(player) {
        player = JSON.parse(JSON.stringify(player));
        return player1 === player._id || player2 === player._id;
    });

    if(playersToPlay.length === 1) playersToPlay.push(playersToPlay[0]);


    var func1 = new Function(playersToPlay[0].func),
        func2 = new Function(playersToPlay[1].func);

    var result1, result2,
        player1Wins = 0,
        player2Wins = 0;

    for(var i = 0; i < 1000; i++) {

        result1 = func1(result2);
        result2 = func2(result1);

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

    var winner = player1Wins > player2Wins ? playersToPlay[0] : playersToPlay[1];

    if(player1Wins === player2Wins) {
        winner = playersToPlay
    }

    res.send({
        winner: winner
    });
};

exports.getPlayers = function(req, res) {
    res.send(players);
};