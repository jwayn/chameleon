import React, { Component } from 'react'

import './Splash.css';

export default class Splash extends Component {

    joinGame = () => {
        this.props.renderPage('join');
    }

    newGame = () => {
        this.props.renderPage('create');
    }

    render() {
        return (
            <div>
                <div className="main-container --splash">
                    <div className="brand">
                        <h1>Chameleon</h1>
                    </div>
                    <div className="button-group">
                        <button className="button--default" onClick={this.joinGame}>Join Game</button>
                        <button className="button--default" onClick={this.newGame}>New Game</button>
                    </div>
                </div>
            </div>
        )
    }
}
