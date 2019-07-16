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

function getGame(code) {
    for(let i = 0; i < games.length; i++) {
        if (games[i].code === code) {
            return games[i];
        }
    }
};

class Game {
    constructor(host, socket) {
        this.code = generateCode(4);
        this.players = [];
        this.chat = [];
        this.playerJoin(host, socket);
        this.turn = 0;
        this.status = 'lobby';
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    playerJoin(player, socket) {
        this.players.push(player);
        //update lobby with player names
        console.log(this.code);
        socket.join(this.code);
        io.to(this.code).emit('update players', this.players.map(player => player.name));
    };

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

    startRound() {
        this.players.forEach(player => {
            player.isChameleon = false;
            player.wordGiven = '';
            player.votedFor = '';
        });
        this.status = 'inProgess';
        this.chameleon = this.players[Math.floor(Math.random() * this.players.length)];
        this.topic = topics[Math.floor(Math.random() * topics.length)];
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
        io.to(`${this.code}-players`).emit('game started', {topic: this.topic, playerType: 'player', secretWord: this.secretWord});
        this.playerTurn(this.players[this.turn]);
    };

    startTimer(seconds, player) {

        let self = this;
        io.to(self.code).emit('update timer', seconds)
        let countDown = () => {
            io.to(self.code).emit('update timer', seconds)
            seconds--;
            if(seconds < 0) {
                console.log(this.code);
                io.to(this.code).emit('receive message', {author: 'System', content: `${player.name} failed to give a clue in time.`});
                clearInterval(this.timerInterval);
                self.endTurn(player);
            }
        };
        
        this.timerInterval = setInterval(countDown, 1000)
    }

    playerTurn(player) {
        console.log(player.socketId);
        console.log(player.name + "'s turn");
        io.to(this.code).emit('receive message', {author: 'System', content: `It is ${player.name}'s turn.`});
        io.to(player.socketId).emit('my turn');
        io.to(this.code).emit('current turn', player.name);
        this.startTimer(30, player);
    };

    endTurn() {
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
        let seconds = 120;
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
                console.log(this.code);
                // Get the player that was voted for, and compare to chameleon
                // return playerVoted to vote over event
                io.to(this.code).emit('vote over');
            }
        }

        this.timerInterval = setInterval(countDown, 1000);
    }
}

app.post('/join', async (req, res) => {
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
    res.status(404).json({message: 'Game does not exist.'})
});


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

    socket.on("create game", (name) => {
        // Create our new player instance
        let player = new Player(name, socket, socketId);
        player.isHost = true;
        // Create our new game instance
        let game = new Game(player, socket);

        // Grab the room code and join the socket to it
        let room = game.code;
        socket.join(room);

        // Push our games to the games array
        games.push(game);
        io.to(socketId).emit('new game', {code: game.code});
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
                    io.to(socketId).emit('game joined', {code: games[i].code});
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
        io.to(data.code).emit('alert', {message: `${currentPlayer.name}'s clue is '${data.word}'.`});
        currentGame.endTurn();
    });

    socket.on("start game", code => {
        console.log('Game starting.');
        games.forEach(game => {
            if(game.code === code) {
                game.startRound();
            }
        })
    })

    socket.on("receive message", data => {
        console.log(data);
        const selectedGame = getGame(data.code);
        const selectedPlayer = selectedGame.getPlayer(socket);
        selectedGame.sendMessage(data, selectedPlayer);
    })

    socket.on("disconnect", (data => {
        // Remove the disconnected player from any active games
        games.forEach(game => {
            game.players.forEach(player => {
                if(player.socket === socket) {
                    game.playerLeave(player);
                }
            })
        })
        connections.splice(connections.indexOf(socket), 1);
    }));
});

server.listen(port, () => {
    console.log(`Listening on port ${port}`)
});