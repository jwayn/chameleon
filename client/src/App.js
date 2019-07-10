import React, { Component } from 'react';
import io from 'socket.io-client';

import Splash from './components/Splash';

const socketUrl = "http://localhost:8080";
class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            socket: null
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
        this.setState({socket});
    }
    
    render() {
        return (
            <div className="container">
                <Splash />
            </div>
        );
    }
}

export default App;
