import React, { Component } from 'react'

import Chat from './Chat';

export default class Results extends Component {

    constructor(props) {
        super(props);

        this.state = {voteCorrect: false};
    }

    componentDidMount() {
        if(this.props.chameleon === this.props.winningPlayer) {
            this.setState({voteCorrect: true});
        }
    }

    render() {
        return (
            <div className="main-container --results">
                {!this.props.isChameleon && this.state.voteCorrect &&
                    <>
                        <h2>The results are in!</h2>
                        <p>You thought the chameleon was <strong>{this.props.winningPlayer}</strong>.</p>
                        <p>And the chameleon was actually...</p>
                        <h1>{this.props.chameleon}</h1>
                    </>
                }

                {this.props.isChameleon && this.state.voteCorrect && 
                    <>
                        <h2>You've been found!</h2>
                    </>
                }

                {this.props.isChameleon && !this.state.voteCorrect &&
                    <>
                        <h2>You got away this time!</h2>
                    </>
                }
                {this.props.isHost &&
                    <div className="button-group">
                            <button className="button--default" onClick={this.props.startGame}>New Game?</button>
                    </div>
                }
                <Chat messages={this.props.messages} code={this.props.code} socket={this.props.socket} />
            </div>
        )
    }
}
