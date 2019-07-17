import React, { Component } from 'react'

export default class Clue extends Component {
    render() {
        return (
            <div className="vote__info">
                <span className="vote__info__playername">{this.props.player.name}</span>
                <span className="vote__info__playeranswer">{this.props.player.answer}</span>
            </div>
        )
    }
}
