import React, { Component } from 'react';
import io from 'socket.io-client';

import Splash from './components/Splash';
import CreateGame from './components/CreateGame';
import JoinGame from './components/JoinGame';
import Lobby from './components/Lobby';
import Round from './components/Round';

// enable vibration support
navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;

const socketUrl = "http://192.168.1.194:8080/";
class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            socket: null,
            rendered: 'splash',
            isHost: false,
            players: [],
            code: '',
            message: '',
            topic: {},
            timer: 0,
            currentTurn: ''
        }
    }

    componentDidMount() {
        this.initSocket();
    }

    initSocket = () => {
        const socket = io(socketUrl);
        socket.on('connect', () => {
            console.log('Connected to host.');
        });
        
        socket.on('new game', data => {
            console.log('New game created with code: ', data.code);
            this.setState({code: data.code, isHost: true});
        });

        socket.on('game joined', data => {
            console.log('Game was joined!');
            this.setState({code: data.code});
        });

        socket.on('leave game', data => {
            this.setState({message: data.message || ''});
            this.leaveGame(socket);
        });

        socket.on("update players", (players) => {
            console.log('Updating players for the lobby!');
            this.setState({players})
        });

        socket.on("update timer", timer => {
            this.setState({timer});
        })

        socket.on("error", message => {
            this.setState({message});
        })

        socket.on("game started", data => {
            if(data.playerType !== 'chameleon'){
                console.log(data.topic);
                console.log(data.secretWord);
                this.setState({topic: data.topic, secretWord: data.secretWord});
                this.renderPage('round');
            } else {
                this.setState({topic: data.topic});
                this.renderPage('round');
            }
        });
        
        socket.on("my turn", () => {
            this.setState({isMyTurn: true});
            if (navigator.vibrate) {
                navigator.vibrate(3000);
            }
        });

        socket.on("turn over", () => {
            this.setState({isMyTurn: false});
        });

        socket.on("current turn", playerName => {
            this.setState({currentTurn: playerName})
        })

        this.setState({socket});
    }

    setCode = (code) => {
        this.setState({code});
    }
    
    setMessage = (message) => {
        this.setState({message});
    }

    leaveGame = (socket) => {
        socket.emit('leave game');
        this.setState({rendered: 'splash', isHost: false, players: [], code: ''});
    }

    renderPage = (page) => {
        this.setState({
            rendered: page
        });
    }

    startGame = () => {
        console.log('Game starting!');
        this.state.socket.emit('start game', this.state.code);
    }
    
    render() {
        return (
            <div className="container">
                {this.state.rendered === 'splash' && 
                    <Splash renderPage={this.renderPage} />
                }
                {this.state.rendered === 'create' &&
                    <CreateGame renderPage={this.renderPage} socket={this.state.socket} setHost={this.setHost} />
                }
                {this.state.rendered === 'join' &&
                    <JoinGame renderPage={this.renderPage} socket={this.state.socket} message={this.state.message} setMessage={this.setMessage} setCode={this.setCode} />
                }
                {this.state.rendered === 'lobby' &&
                    <Lobby renderPage={this.renderPage} socket={this.state.socket} isHost={this.state.isHost} code={this.state.code} players={this.state.players} leaveGame={this.leaveGame} startGame={this.startGame} />
                }
                {this.state.rendered === 'round' &&
                    <Round renderPage={this.renderPage} socket={this.state.socket} playerType={this.state.playerType} currentTurn={this.state.currentTurn} topic={this.state.topic} secretWord={this.state.secretWord} isMyTurn={this.state.isMyTurn} timer={this.state.timer} />
                }
            </div>
        );
    }
}

export default App;
