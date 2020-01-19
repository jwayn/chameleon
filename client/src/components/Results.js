import React, { Component } from 'react'

import Chat from './Chat';

export default class Results extends Component {

    constructor(props) {
        super(props);

        this.state = {
            voteCorrect: false,
            topics: [],
        };
    }

    async componentDidMount() {
        if(this.props.chameleon === this.props.winningPlayer) {
            this.setState({voteCorrect: true});
        }

        let data = await fetch('/topics');
        let topics = await data.json();
        topics.sort();
        topics.unshift('Random');
        this.setState({topics});
    }

    render() {
        return (
            <div className="main-container --results">
                {!this.props.isChameleon &&
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
                        <p>Do you know what the secret word was?</p>
                    </>
                }

                {this.props.isChameleon && !this.state.voteCorrect &&
                    <>
                        <h2>You got away this time!</h2>
                    </>
                }
                {this.props.isHost &&
                    <>
                        <div className="results__form-group">
                            <label>Topic</label>
                            <select onChange={this.props.changeTopic}>
                                {this.state.topics.map(topic => {
                                    return (<option value={topic} key={topic}>{topic}</option>);
                                })
                                }
                            </select>
                        </div>
                        <div className="button-group">
                            <button className="button--default" onClick={this.props.startGame}>New Game?</button>
                        </div>
                    </>
                }
                <Chat messages={this.props.messages} code={this.props.code} socket={this.props.socket} />
            </div>
        )
    }
}
