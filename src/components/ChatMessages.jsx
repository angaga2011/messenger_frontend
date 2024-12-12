import React, { useEffect } from "react";

const ChatMessages = ({ messages, messagesEndRef }) => {
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-messages">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`chat-message ${message.sender === userEmail ? "sent" : "received"}`}
        >
          <p>{message.content}</p>
          <p className="message-timestamp">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;