var mongo = require('mongojs'),
    _     = require('lodash'),
    ObjectID = require('mongodb').ObjectID;

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

    if(funcIsBad(player.func)) {
        next({msg: "Cannot use Date or Random objects"});
        return;
    }

    try {
        var func = (new Function(player.func))();

        var result = func(func(null));

        if(typeof result !== 'number') {
            next({msg: "function must return number"});
            return;
        }
    } catch(error) {
        next({msg: "error parsing or executing the function"});
        return;
    }


    db.players.save(player, function(err, saved) {
        if(err || !saved) {
            res.send({error: "cannot create player"});
        } else {
            res.send(req.body);
            players.push(player);
        }
    });
};

exports.getPlayers = function(req, res) {
    res.send(players);
};

exports.removePlayer = function(req, res) {
    var id = req.params.id;

    players = _.without(players, _.find(players, function(player) {
        return JSON.parse(JSON.stringify(player))._id === id;
    }));

    db.players.remove({_id: new ObjectID(id)}, function(err, removed) {
        if(err || !removed) {
            res.send({error: "cannot remove player"});
        } else {
            res.send();
        }
    });
};

exports.testGame = function(req, res, next) {
    var player2Id = req.body.player,
        testFunc = req.body.func;

    var player2 =_.find(players, function(player) {
        player = JSON.parse(JSON.stringify(player));
        return player2Id === player._id;
    });

    try {
        var func1 = (new Function(testFunc))(),
            func2 = (new Function(player2.func))();

        var resp = startGame(func1, func2);
    } catch(error) {
        next({msg: "Cannot compile or run your function!"});
        return;
    }

    resp.test = true;

    res.send(resp);
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

    if(funcIsBad(player1.func)) {
        res.send({
            player1: 0,
            player2: 1
        });
        return;   
    }

    if(funcIsBad(player2.func)) {
        res.send({
            player1: 1,
            player2: 0
        });
        return;   
    }

    var func1 = (new Function(player1.func))(),
        func2 = (new Function(player2.func))();

    var tRequire = require,
        tConsole = console.log;

    require = function() {return {}};
    console.log = function() {};

    var result = startGame(func1, func2);

    require = tRequire;
    console.log = tConsole;

    res.send(result);
};

function startGame(func1, func2) {

    var temp1, temp2,
        result1 = null,
        result2 = null,
        player1Wins = 0,
        player2Wins = 0;

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

    return {
        player1: player1Wins,
        player2: player2Wins
    }
}

function funcIsBad(func) {
    return (
        func.indexOf('random') !== -1 ||
        func.indexOf('Date') !== -1 ||
        func.indexOf('require') !== -1 ||
        func.indexOf('console') !== -1 ||
        func.indexOf('callee') !== -1 ||
        func.indexOf('caller') !== -1
    );
}
