const app = require('http').createServer();
const io = require('socket.io')(app);
const uuid = require('uuid/v4');
const topics = require('./topics');

const port = process.env.PORT || 8080;

let games = [];
let connections = [];

class Game {
    constructor(host, socket) {
        this.code = generateCode(4);
        this.players = [];
        this.chat = [];

        this.playerJoin(host, socket);
    }

    playerJoin(player, socket) {
        this.players.push(player);
        //update lobby with player names
        console.log(this.code);
        socket.join(this.code);
        io.to(this.code).emit('update players', this.players.map(player => player.name));
    };

    playerLeave(player) {
        this.players.splice(this.players.indexOf(player), 1);
        io.to(this.code).emit('update players', this.players.map(player => player.name));
    };
}

class Player {
    constructor(name, socket, socketId) {
        this.name = name;
        this.id = uuid();
        this.points = 0;
        this.isChameleon = false;
        this.wordGiven = '';
        this.votedFor = '';
        this.socket = socket;
        this.socketId = socketId;
    }

    vote(player) {
        this.votedFor = player;
    };

    giveWord(word) {
        this.wordGiven = word;
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
                let player = new Player(name, socket);
                games[i].playerJoin(player, socket);
                socket.join(room);
                io.to(socketId).emit('game joined', {code: games[i].code});
                break;
            }
        }
    });

    socket.on("leave game", () => {
        games.forEach(game => {
            game.players.forEach(player => {
                if(player.socket === socket) {
                    game.playerLeave(player);
                }
            })
        })
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
    }))
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});