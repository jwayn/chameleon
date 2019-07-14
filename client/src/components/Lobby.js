import React, { Component } from 'react'

import './Lobby.css';

export default class Lobby extends Component {
    
    back = () => {
        this.props.leaveGame(this.props.socket);
    }

    render() {
        return (
            <div>
                <div className="main-container --lobby">
                    <div className="back" onClick={this.back}></div>
                    <div className="title">
                        <h2>Game Code:</h2>
                        <h1>{this.props.code}</h1>
                    </div>
                    <div className="lobby__players">
                        <h2>{`${this.props.players.length} of 8 players.`}</h2>
                        {this.props.players.map(player => {
                                return (<h2>{player}</h2>)
                            }
                        )}
                    </div>
                    {this.props.isHost &&
                    <div className="button-group">
                            <button className="button--default" onClick={this.props.startGame}>Start Game</button>
                    </div>
                    }
                </div>
            </div>
        )
    }
}
