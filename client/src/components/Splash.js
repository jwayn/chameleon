import React, { Component } from 'react'

import './Splash.css';

export default class Splash extends Component {
    render() {
        return (
            <div>
                <div className="main-container">
                    <div className="brand">
                        <h1>Chameleon</h1>
                    </div>
                    <div className="button-group">
                        <button className="button--default">Join Game</button>
                        <button className="button--default">New Game</button>
                    </div>
                </div>
            </div>
        )
    }
}
