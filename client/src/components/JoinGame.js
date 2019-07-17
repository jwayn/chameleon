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

    join = async e => {
        e.preventDefault();
        let socket = this.props.socket;
        const body = {name: this.name.current.value, code: this.code.current.value};
        const options = {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        };
        let game = await fetch('/join', options);
        let jsonGame = await game.json();
        if(game.status === 200) {
            this.props.setCode(jsonGame.code);
            if(this.name.current.value.length > 0 && this.code.current.value.length === 4) {
                socket.emit('join game', {name: this.name.current.value, code: this.code.current.value.toUpperCase()});
                this.props.renderPage('lobby');
            } else {
                console.log('Nice try!');
            }
        } else {
            this.props.setMessage(jsonGame.message);
        }

        // 
        // if(this.props.message === 'Game does not exist.') {
        //     return;
        // } else {
        //     this.props.renderPage('lobby');
        // }
    }

    forceUpper = () => {
        this.code.current.value = this.code.current.value.toUpperCase();
    }

    render() {
        return (
            <div>
                <div className="main-container --join">
                    <div className="back" onClick={this.back}></div>
                    <div className="title">
                        <h2>Join a Game</h2>
                    </div>
                    <form className="form-group">
                        <label>Name</label>
                        <input maxLength="12" ref={this.name} />
                        <label>Game Code</label>
                        <input maxLength="4" ref={this.code} onChange={this.forceUpper} />
                        <button className="button--default" onClick={this.join} type="submit">Join Game</button>
                    </form>
                </div>
            </div>
        )
    }
}
