const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const uuid = require('uuid/v4');
const topics = require('./topics');

const port = process.env.PORT || 8080;

app.use(express.json());

let games = [];
let connections = [];

class Game {
    constructor(host, socket, voteTime, turnTime, topicSelected) {
        this.id = uuid();
        this.code = generateCode(4);
        this.players = [];
        this.chat = [];
        this.playerJoin(host, socket);
        this.turn = 0;
        this.status = 'lobby';
        this.voteTime = voteTime || 30;
        this.turnTime = turnTime || 30;
        this.topicSelected = topicSelected || 'random';
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Join a player to this game
    playerJoin(player, socket) {
        this.players.push(player);
        //update lobby with player names
        console.log(player.name, this.code);
        socket.join(this.code);
        io.to(this.code).emit('update players', this.players.map(player => player.name));
    };

    //Send a chat message to this game
    sendMessage(message, player) {
        io.to(this.code).emit('receive message', {author: player.name, content: message.content});
    }

    playerLeave(player) {
        this.players.splice(this.players.indexOf(player), 1);
        io.to(this.code).emit('update players', this.players.map(player => player.name));

        //If there are no players left in the game, delete it.
        if(player.isHost) {
            games.splice(games.indexOf(this), 1)
            io.to(this.code).emit('leave game', 'The host disbanded the game.');
        }
    };

    getPlayer(socket) {
        for(let i = 0; i < this.players.length; i++) {
            if(this.players[i].socket === socket) {
                return this.players[i];
            }
        }
    }

    getPlayerById(id) {
        for(let i = 0; i < this.players.length; i++) {
            if(this.players[i].id === id) {
                return this.players[i];
            }
        }
    }

    startRound(topic='') {
        console.log('Round starting.');
        this.players.forEach(player => {
            player.isChameleon = false;
            player.wordGiven = '';
            player.votedFor = '';
        });
        this.status = 'inProgess';
        this.turn = 0;
        this.chameleon = this.players[Math.floor(Math.random() * this.players.length)];

        // Select topic with topic name, or random if topic = "random" || falsy
        if(!topic) {
            console.log('No topic passed, must be a fresh game.')
            console.log('Topic selected: ', this.topicSelected);
            if(!this.topicSelected || this.topicSelected.toLowerCase() === 'random') {
                console.log('Random topic');
                this.topic = topics[Math.floor(Math.random() * topics.length)];
            } else {
                console.log('Non-random topic');
                this.topic = topics.filter(topic => topic.topic === this.topicSelected);
                this.topic = this.topic[0];
            }
        } else {
            console.log('Topic passed, must be a new game from results screen')
            this.topic = topics.filter(topicObj => topicObj.topic === topic);
            this.topic = this.topic[0];
        }

        console.log('Selected Topic: ', this.topicSelected, 'Actual Topic: ', this.topic)


        this.secretWord = this.topic.words[Math.floor(Math.random() * this.topic.words.length)];
        //join chameleon to room-chameleon
        //join others to room-players
        this.players.forEach(player => {
            if(player === this.chameleon) {
                console.log(player.name + ' is the chameleon.');
                player.socket.join(`${this.code}-chameleon`);
            } else {
                console.log(player.name + ' is a player.');
                player.socket.join(`${this.code}-players`);
            }
        });

        this.shuffle(this.players);

        io.to(`${this.code}-chameleon`).emit('game started', {topic: this.topic, playerType: 'chameleon'});
        io.to(`${this.code}-chameleon`).emit('chameleon');
        io.to(`${this.code}-players`).emit('game started', {topic: this.topic, playerType: 'player', secretWord: this.secretWord});
        this.playerTurn(this.players[this.turn]);
    };

    startTimer(seconds, player) {

        io.to(this.code).emit('update timer', seconds)
        let countDown = () => {
            io.to(this.code).emit('update timer', seconds)
            seconds--;
            if(seconds < 0) {
                io.to(this.code).emit('receive message', {author: 'System', content: `${player.name} failed to give a clue in time.`});
                clearInterval(this.timerInterval);
                this.endTurn(player);
            }
        };
        
        this.timerInterval = setInterval(countDown, 1000)
    }

    playerTurn(player) {
        console.log(player.name + "'s turn");
        io.to(this.code).emit('receive message', {author: 'System', content: `It is ${player.name}'s turn.`});
        io.to(player.socketId).emit('my turn');
        io.to(this.code).emit('current turn', player.name);
        this.startTimer(this.turnTime, player);
    };

    endTurn() {
        console.log('Turn ended!');
        clearInterval(this.timerInterval);
        if(this.turn === this.players.length - 1) {
            io.to(this.players[this.turn].socketId).emit('turn over');
            console.log('turns are over!');
            this.startVote();
        } else {
            io.to(this.players[this.turn].socketId).emit('turn over');
            this.turn++;
            this.playerTurn(this.players[this.turn]);
        }
    }

    startVote() {
        let seconds = this.voteTime;
        const answers = this.players.map(player => {
            return {id: player.id, name: player.name, answer: player.submittedWord}
        });
        console.log(answers);
        io.to(this.code).emit('start vote', answers);
        io.to(this.code).emit('update timer', seconds);
        let countDown = () => {
            io.to(this.code).emit('update timer', seconds);
            seconds--;
            if(seconds < 0) {
                io.to(this.code).emit('vote over');
                clearInterval(this.timerInterval);
                this.evaluateVotes();
            }
        }

        this.timerInterval = setInterval(countDown, 1000);
    }

    tieBreaker(ids) {
        let seconds = 15;
        const answers = this.players.filter(player => {
            for(let i = 0; i < ids.length; i++) {
                if(player.id === ids[i]) {
                    return player;
                }
            }
        }).map(player => {
            return {id: player.id, name: player.name, answer: player.submittedWord}
        });
        console.log(answers);
        io.to(this.code).emit('tie breaker');
        io.to(this.code).emit('start vote', answers);
        io.to(this.code).emit('update timer', seconds);
        let countDown = () => {
            io.to(this.code).emit('update timer', seconds);
            seconds--;
            if(seconds < 0) {
                io.to(this.code).emit('vote over');
                clearInterval(this.timerInterval);
                this.evaluateVotes();
            }
        }
        this.timerInterval = setInterval(countDown, 1000);
    }

    evaluateVotes() {
        const votes = [];
        const counts = {};
        
        //Gather our votes
        this.players.forEach(player => {
            if(player.votedFor != '') {
                votes.push({playerName: player.name, vote: player.votedFor});
            }
        });

        // Gather our vote count
        for(let i = 0; i < votes.length; i++) {
            counts[votes[i].vote] = 1 + (counts[votes[i].vote] || 0);
        };

        console.log('Votes: ', votes);
        console.log('Counts: ', counts);
         
        //tally up and return the winner
        const getMax = object => {
            return Object.keys(object).filter(x => {
                 return object[x] == Math.max.apply(null, 
                 Object.values(object));
           });
        };

        let winner = getMax(counts);
        console.log('winner: ', winner[0]);

        if(winner.length === 1) {
            //If we have a clear winner, we're good to go!
            let winningPlayer = this.getPlayerById(winner[0]);
            io.to(this.code).emit('results', {winningPlayer: winningPlayer.name, chameleon: this.chameleon.name});
            this.players.forEach(player => {
                player.socket.leave(`${this.code}-chameleon`);
                player.socket.leave(`${this.code}-players`);
            })
        } else if (winner.length < 1) {
            //If we have no votes, start the vote process over
            this.startVote();
        } else {
            //If we have a tie, initiatie a tie breaker.

            //Reset the votes
            // this.players.forEach(player => {
            //     player.votedFor = '';
            // });
            io.to(this.code).emit('tie');
            this.tieBreaker(winner);
        }


    }
}

// Utility function to get a game by the gamecode
function getGame(code) {
    for(let i = 0; i < games.length; i++) {
        if (games[i].code === code) {
            return games[i];
        }
    }
};

class Player {
    constructor(name, socket, socketId) {
        this.name = name;
        this.isHost = false;
        this.id = uuid();
        this.points = 0;
        this.isChameleon = false;
        this.submittedWord = '';
        this.votedFor = '';
        this.socket = socket;
        this.socketId = socketId;
    }

    vote(player) {
        this.votedFor = player;
    };

    submitWord(word) {
        this.submittedWord = word;
    };
}

app.use(express.static(__dirname + '/public'));

app.post('/join', async (req, res) => {
    console.log('Trying to join...');
    let room = req.body.code;
    let name = req.body.name;

    // Check existence of game, and add player to it if it exists. 
    for(let i = 0; i < games.length; i++) {
        if(games[i].code === room) {
            if(games[i].status === 'lobby') {
                return res.json({room})
            } else {
                return res.status(403).json({message: 'Game already in progress.'})
            }
        }
    };
    res.status(403).json({message: 'Game does not exist.'});
});

app.get('/topics', async (req, res) => {
    res.json(topics.map(topic => topic.topic));
});

function generateCode(len) {
    let code = "";

    const charset = "abcdefghijklmnopqrstuvwxyz";

    for (var i = 0; i < len; i++) {
        code += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    if(games.filter(game => game.code === code).length > 0) {
        generateCode(len);
    } else {
        return code.toUpperCase();
    }
}

io.on('connection', (socket) => {
    const socketId = socket.id;
    connections.push(socket);

    socket.on("create game", (config) => {
        console.log(config);
        // Create our new player instance
        let player = new Player(config.name, socket, socketId);
        player.isHost = true;
        // Create our new game instance
        let game = new Game(player, socket, config.turnTime, config.voteTime, config.topic);

        // Grab the room code and join the socket to it
        let room = game.code;
        socket.join(room);

        // Push our games to the games array
        games.push(game);
        io.to(socketId).emit('new game', {code: game.code, playerId: player.id});
    });

    socket.on("join game", (data) => {
        let room = data.code;
        let name = data.name;

        // Check existence of game, and add player to it if it exists. 
        for(let i = 0; i < games.length; i++) {
            if(games[i].code === room) {
                if(games[i].status === 'lobby') {
                    let player = new Player(name, socket, socketId);
                    games[i].playerJoin(player, socket);
                    socket.join(room);
                    io.to(socketId).emit('game joined', {code: games[i].code, playerId: player.id});
                    return;
                } else {
                    io.to(socketId).emit('error', {message: 'Game already in progress.'});
                    return;
                }
            }
        }

        io.to(socketId).emit('error', {message: 'Game does not exist.'});
    });

    socket.on("leave game", () => {
        games.forEach(game => {
            game.players.forEach(player => {
                if(player.socket === socket) {
                    socket.leave(game.code);
                    game.playerLeave(player);
                }
            })
        })
    })

    socket.on("word submitted", data => {
        let currentGame = getGame(data.code);
        let currentPlayer = currentGame.getPlayer(socket);
        currentPlayer.submitWord(data.word);
        io.to(data.code).emit('alert', {message: `${currentPlayer.name}'s clue is '${data.word || 'N/A'}'.`});
        currentGame.endTurn();
    });

    socket.on("start game", config => {
        console.log('Game starting.');
        console.log('Game config: ', config);
        games.forEach(game => {
            if(game.code === config.code) {
                game.startRound(config.topic);
            }
        })
    })

    socket.on("receive message", data => {
        const selectedGame = getGame(data.code);
        const selectedPlayer = selectedGame.getPlayer(socket);
        selectedGame.sendMessage(data, selectedPlayer);
    })

    socket.on("disconnect", data => {
        // Remove the disconnected player from any active games
        games.forEach(game => {
            game.players.forEach(player => {
                if(player.socket === socket) {
                    if(player.isHost) {
                        console.log('Host left!');
                        io.to(game.code).emit('leave game', 'The host disbanded the game.');
                        clearInterval(game.timerInterval);
                        games.splice(games.indexOf(game), 1);
                    } else {
                        let message = `${player.name} has left the game.`;
                        console.log(message);
                        io.to(game.code).emit('receive message', {author: 'System', content: message});
                        game.playerLeave(player);
                    }
                }
            })
        });
    });

    socket.on("place vote", data => {
        console.log('Vote from client: ', data);
        let currentGame = getGame(data.code);
        let currentPlayer = currentGame.getPlayer(socket);
        currentPlayer.vote(data.id);
    });
});

server.listen(port, () => {
    console.log(`Listening on port ${port}`)
});