import React, { Component } from 'react'

import './CreateGame.css';

export default class CreateGame extends Component {

    constructor(props) {
        super(props);

        this.state = {
            name: '',
            topic: '',
            turnTime: 30,
            voteTime: 30,
            topics: [],
        };
    }
    back = () => {
        this.props.renderPage('splash');
    }

    createGame = e => {
        e.preventDefault();
        if(this.state.name !== '') {
            this.props.socket.emit('create game',
                {
                    name: this.state.name,
                    turnTime: this.state.turnTime,
                    voteTime: this.state.voteTime,
                    topic: this.state.topic,
                }
            );
            this.props.renderPage('lobby');
        }
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
                        <div className="max-sm">
                            <div>
                                <label>Name</label>
                                <input value={this.state.name} onChange={this.changeName} />
                            </div>
                            <div>
                                <label>Topic</label>
                                <select onChange={this.changeTopic}>
                                    {this.state.topics.map(topic => {
                                        return (<option value={topic} key={topic}>{topic}</option>);
                                    })
                                    }
                                </select>
                            </div>
                            <div>
                                <label>Turn Timer (seconds)</label>
                                <input value={this.state.turnTime} type="number" onChange={this.changeTurnTimer} />
                            </div>
                            <div>
                                <label>Voting Time (seconds)</label>
                                <input value={this.state.voteTime} type="number" onChange={this.changeVotingTime}/>
                            </div>
                            <button className="button--default" onClick={this.createGame} type="submit">Create Game</button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    changeName = e => {
        this.setState({name: e.target.value});
    }

    changeTopic = e => {
        this.setState({topic: e.target.value});
    }

    changeTurnTimer = e => {
        this.setState({turnTime: e.target.value});
    }

    changeVotingTime = e => {
        this.setState({voteTime: e.target.value});
    }

    async componentDidMount() {
        let data = await fetch('/topics');
        let topics = await data.json();
        topics.sort();
        topics.unshift('Random');
        this.setState({topics});
    }
}
