import React, { Component } from 'react';
import io from 'socket.io-client';

import Splash from './components/Splash';
import CreateGame from './components/CreateGame';
import JoinGame from './components/JoinGame';
import Lobby from './components/Lobby';

const socketUrl = "http://localhost:8080";
class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            socket: null,
            rendered: 'splash',
            isHost: false,
            players: [],
            code: ''
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
            console.log('New game event');
            console.log(data.code);
            this.setState({code: data.code, isHost: true});
        })

        socket.on('game joined', data => {
            console.log('Game was joined!');
            this.setState({code: data.code});
        })

        socket.on("update players", (players) => {
            console.log('Updating players for the lobby!');
            this.setState({players})
        })
        this.setState({socket});
    }

    renderPage = (page) => {
        this.setState({
            rendered: page
        })
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
                    <JoinGame renderPage={this.renderPage} socket={this.state.socket} />
                }
                {this.state.rendered === 'lobby' &&
                    <Lobby renderPage={this.renderPage} socket={this.state.socket} isHost={this.state.isHost} code={this.state.code} players={this.state.players} />
                }
            </div>
        );
    }
}

export default App;
