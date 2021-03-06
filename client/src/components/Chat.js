import React, { Component } from 'react'

import './Chat.css';

export default class Chat extends Component {

    constructor(props) {
        super(props);
        this.messageContent = React.createRef();
    }

    sendMessage = e => {
        e.preventDefault();
        this.props.socket.emit("receive message", {code: this.props.code, content: this.messageContent.current.value});
        this.messageContent.current.value = '';
    }

    scrollToBottom = () => {
        this.chatEnd.scrollIntoView({behavior: "smooth"});
    }

    componentDidUpdate(prevProps) {
        if(prevProps.messages !== this.props.messages) {
            this.scrollToBottom();
        }
    }

    render() {
        return (
            <div className="chat">
                <div className="chat__messages">
                    {this.props.messages.map(message => {
                        return(
                                <div className="chat__message">
                                    <span className="chat__message__author" style={message.author === 'System' ? {color: 'red'} : {}}>{message.author}</span>: {message.content}
                                </div>
                        )
                    })}
                    <div ref={(el) => { this.chatEnd = el; }}>
                    </div>
                </div>
                <form className="chat__submit">
                    <input className="chat__submit__input" placeholder="Start typing..." ref={this.messageContent} />
                    <button className="chat__submit__button" onClick={this.sendMessage} type="submit">Send</button>
                </form>
            </div>
        )
    }
}
