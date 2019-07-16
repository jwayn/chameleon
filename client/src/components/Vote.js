import React, { Component } from 'react'

import Chat from './Chat';

export default class Vote extends Component {
    render() {
        return (
            <div>
                
                <Chat messages={this.props.messages} code={this.props.code} socket={this.props.socket} />
            </div>
        )
    }
}
