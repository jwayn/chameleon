import React, { Component } from 'react'

import './CreateGame.css';

export default class CreateGame extends Component {

    constructor(props) {
        super(props);

        this.name = React.createRef();
    }
    back = () => {
        this.props.renderPage('splash');
    }

    createGame = e => {
        e.preventDefault();
        let socket = this.props.socket;
        socket.emit('create game', this.name.current.value);
        this.props.renderPage('lobby');
    }
    
    render() {
        return (
            <div>
                <div className="main-container --create">
                    <div className="back" onClick={this.back}></div>
                    <div className="title">
                        <h2>Create a Game</h2>
                    </div>
                    <form className="form-group">
                        <label>Name</label>
                        <input ref={this.name} />
                        <button className="button--default" onClick={this.createGame} type="submit">Create Game</button>
                    </form>
                </div>
            </div>
        )
    }
}
