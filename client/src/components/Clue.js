import React, { Component } from 'react'

export default class Clue extends Component {

    constructor(props) {
        super(props);
        this.state = {clueSelected: false};
    }
    componentDidUpdate() {
        if(this.props.timer === 0) {
            console.log('Votes being sent in!');
        }
    }

    selectClue = () => {
        this.props.selectClue(this.props.id);
    }

    render() {
        return (
            <div className={this.props.selectedClue === this.props.id ? "vote__info vote__info__selected" : "vote__info"} onClick={this.selectClue}>
                <span className="vote__info__playername">{this.props.player.name}</span>
                <span className="vote__info__playeranswer">{this.props.player.answer}</span>
            </div>
        )
    }
}
