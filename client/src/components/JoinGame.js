import React, { Component } from 'react'

import './CreateGame.css';

export default class JoinGame extends Component {
    
    constructor(props) {
        super(props);

        this.name = React.createRef();
        this.code = React.createRef();
    }

    back = () => {
        this.props.renderPage('splash');
    }

    join = () => {

        let socket = this.props.socket;
        socket.emit('join game', {name: this.name.current.value, code: this.code.current.value});
        this.props.renderPage('lobby');
    }

    render() {
        return (
            <div>
                <div className="main-container --join">
                    <div className="back" onClick={this.back}></div>
                    <div className="title">
                        <h2>Join a Game</h2>
                    </div>
                    <div className="form-group">
                        <label>Name</label>
                        <input maxLength="12" ref={this.name} />
                        <label>Game Code</label>
                        <input maxLength="4" ref={this.code} />
                    </div>
                    <div className="button-group">
                        <button className="button--default" onClick={this.join}>Join Game</button>
                    </div>
                </div>
            </div>
        )
    }
}
