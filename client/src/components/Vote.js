import React, { Component } from 'react'

import Chat from './Chat';
import './Vote.css';

export default class Vote extends Component {

    constructor(props) {
        super(props);
        this.state = {showVote: true};
    }
    render() {
        return (
            <div className="main-container --vote">
                {this.showVote && this.props.playerAnswers.map(player => {
                    return(
                        <div className="vote__info" key={player.id}>
                            <span className="vote__info__playername">{player.name}</span>
                            <span className="vote__info__playeranswer">{player.answer}</span>
                        </div>
                    )
                })}
                {!this.showVote && 
                    <div className="round__topic">
                        <div className="round__topic__title">{this.props.topic.topic}</div>
                        {
                            this.props.topic.words.map(word => {
                                if(this.props.secretWord === word) {
                                    return <div className="round__topic__word highlighted">{word}</div>
                                } else {
                                    return <div className="round__topic__word">{word}</div>
                                }
                            })
                        }
                    </div>
                }
                <div className="vote__selection-box">
                    <div className={this.state.showVote ? "vote__selection-box__clues" : "vote__selection-box__clues vote__selection-box__clues--enabled"} onClick={this.toggleVote}>Clues</div>
                    <div className={!this.state.showVote ? "vote__selection-box__topic" : "vote__selection-box__topic vote__selection-box__topic--enabled"} onClick={this.toggleVote}>Topic</div>
                </div>
                <Chat messages={this.props.messages} code={this.props.code} socket={this.props.socket} />
            </div>
        )
    }
}
