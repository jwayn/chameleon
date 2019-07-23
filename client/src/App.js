import React, { Component } from 'react';
import io from 'socket.io-client';

import Splash from './components/Splash';
import CreateGame from './components/CreateGame';
import JoinGame from './components/JoinGame';
import Lobby from './components/Lobby';
import Round from './components/Round';
import Vote from './components/Vote';
import Results from './components/Results';

// enable vibration support
navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;

const socketUrl = "http://192.168.1.194:8080/";
class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            socket: null,
            id: '',
            rendered: 'splash',
            isHost: false,
            players: [],
            code: '',
            message: '',
            topic: {},
            timer: 0,
            currentTurn: '',
            showAlert: false,
            alert: '',
            messages: [],
            playerAnswers: [],
            vote: '',
            isChameleon: false,
            tieBreaker: false
        }
    }

    componentDidMount() {
        this.initSocket();
    }

    createAlert = (message) => {
        console.log(message);
        this.setState({messages: [ ...this.state.messages, {author: 'System', content: message} ]});
    };

    initSocket = () => {
        const socket = io(socketUrl);
        socket.on('connect', () => {
            console.log('Connected to host.');
        });
        
        socket.on('new game', data => {
            console.log('New game created with code: ', data.code);
            this.setState({code: data.code, isHost: true, playerId: data.playerId});
        });

        socket.on('game joined', data => {
            console.log('Game was joined!');
            this.setState({code: data.code, playerId: data.playerId });
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
            this.setState({
                message: '',
                timer: 0,
                currentTurn: '',
                playerAnswers: [],
                vote: '',
                isChameleon: false,
                tieBreaker: false
            });
            if(data.playerType !== 'chameleon'){
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

        socket.on("chameleon", () => {
            this.setState({isChameleon: true});
        })

        socket.on("turn over", () => {
            this.setState({isMyTurn: false});
        });

        socket.on("alert", data => {
            this.createAlert(data.message);
        });

        socket.on("current turn", playerName => {
            this.setState({currentTurn: playerName})
        });

        socket.on("receive message", data => {
            this.setState({messages: [ ...this.state.messages, {author: data.author, content: data.content }]})
        });

        socket.on("start vote", answers => {
            console.log(answers);
            this.setState({playerAnswers: answers, rendered: 'vote'})
        });

        socket.on("answers in", data => {
            this.setState({playerAnswers: data})
        });

        socket.on("tie breaker", () => {
            this.setState({tieBreaker: true});
        })

        socket.on("results", data => {
            this.setState({chameleon: data.chameleon, winningPlayer: data.winningPlayer});
            this.renderPage('results');
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
        this.setState({
            rendered: 'splash',
            isHost: false,
            players: [],
            code: '',
            message: '',
            topic: {},
            timer: 0,
            currentTurn: '',
            showAlert: false,
            alert: '',
            messages: [],
            playerAnswers: [],
            playerId: '',
            vote: '',
            isChameleon: false,
            tieBreaker: false
        });
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

    placeVote = id => {
        console.log(id);
        this.setState({vote: id});
        this.state.socket.emit('place vote', {code: this.state.code, id});
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
                    <Round renderPage={this.renderPage} messages={this.state.messages} socket={this.state.socket} code={this.state.code} playerType={this.state.playerType} currentTurn={this.state.currentTurn} topic={this.state.topic} secretWord={this.state.secretWord} isMyTurn={this.state.isMyTurn} timer={this.state.timer} />
                }
                {this.state.rendered === 'vote' &&
                    <Vote tieBreaker={this.state.tieBreaker} placeVote={this.placeVote} renderPage={this.renderPage} messages={this.state.messages} socket={this.state.socket} code={this.state.code} playerAnswers={this.state.playerAnswers} topic={this.state.topic} secretWord={this.state.secretWord} timer={this.state.timer} playerId={this.state.playerId} />
                }
                {this.state.rendered === 'results' &&
                    <Results messages={this.state.messages} socket={this.state.socket} isHost={this.state.isHost} code={this.state.code} chameleon={this.state.chameleon} startGame={this.startGame} winningPlayer={this.state.winningPlayer} isChameleon={this.state.isChameleon}/>
                }
            </div>
        );
    }
}

export default App;
