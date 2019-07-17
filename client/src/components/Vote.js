import React, { Component } from 'react'

import Chat from './Chat';
import Clue from './Clue';
import './Vote.css';

export default class Vote extends Component {

    constructor(props) {
        super(props);
        this.state = {showVote: true};
    }

    toggleVote = () => {
        this.setState({showVote: !this.state.showVote})
    }

    selectClue = selectedClue => {
        this.setState({selectedClue})
    }

    render() {
        return (
            <div className="main-container --vote">
                <h2>It's time to vote!</h2>
                <h2>{this.props.timer}</h2>
                <div className="vote__container">
                    <div className={this.state.showVote ? "vote__info__container" : "--hidden"}>
                        {this.props.playerAnswers.map(player => {
                            return(
                                <Clue player={player} timer={this.props.timer} id={player.id} key={player.id} selectClue={this.selectClue} selectedClue={this.state.selectedClue} />
                            )
                        })}
                    </div>

                    <div className={!this.state.showVote ? "round__topic" : "--hidden"}>
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
                    <div className="vote__selection-box">
                        <div className={this.state.showVote ? "vote__selection--enabled" : "vote__selection--disabled"} onClick={this.toggleVote}>Clues</div>
                        <div className={!this.state.showVote ? "vote__selection--enabled" : "vote__selection--disabled"} onClick={this.toggleVote}>Topic</div>
                    </div>
                </div>
                <Chat messages={this.props.messages} code={this.props.code} socket={this.props.socket} />
            </div>
        )
    }
}
