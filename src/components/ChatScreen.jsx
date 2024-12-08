import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import io from 'socket.io-client';
import "../css/ChatScreen.css";

const ChatScreen = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail"); // Get the email from local storage

  // Declare JWT token at the top
  const jwt = localStorage.getItem("token");

  const [contacts, setContacts] = useState([]); // Contacts state
  const [selectedContact, setSelectedContact] = useState(null); // Selected contact
  const [messages, setMessages] = useState([]); // Messages state
  const [input, setInput] = useState(""); // Chat input state
  const [socket, setSocket] = useState(null);

  // Create a ref for the chat messages container
  const messagesEndRef = useRef(null);

  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch contacts from the backend
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(
          "https://my-messenger-backend.onrender.com/api/contacts/get-user-contacts",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${jwt}`
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          // Set contacts directly as an array of emails
          setContacts(data.contacts);
        } else {
          const error = await response.json();
          console.error("Failed to fetch contacts:", error.message);
        }
      } catch (err) {
        console.error("Error fetching contacts:", err);
      }
    };

    fetchContacts();
  }, [jwt]);

  // Fetch messages from the backend
  const fetchMessages = useCallback(async (contactEmail) => {
    setMessages([]); // Clear messages before fetching new ones
    try {
      const response = await fetch(
        `https://my-messenger-backend.onrender.com/api/messages/get-user-messages?contactEmail=${contactEmail}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwt}`
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Set messages directly as an array of messages
        setMessages(data.messages);
      } else {
        const error = await response.json();
        console.error("Failed to fetch messages:", error.message);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }, [jwt]);

  // Connect to the socket server
  useEffect(() => {
    const newSocket = io('https://my-messenger-backend.onrender.com');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('register_email', { email: userEmail });
    });

    newSocket.on('receive_message', (message) => {
      if(selectedContact === message.sender){
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [userEmail, selectedContact]);

  // Scroll to the bottom of the chat when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to add a new contact
  const handleAddContact = async () => {
    const newContactEmail = prompt("Enter the email of the new contact:");
    if (!newContactEmail) return;
  
    // Check if the contact is already in the list before making the API call
    const isContactAlreadyAdded = contacts.includes(newContactEmail);
    if (isContactAlreadyAdded) {
      alert("Contact already added.");
      return;
    }

    try {

      if (!jwt) {
        alert("You are not logged in. Please log in first.");
        return;
      }
  
      const response = await fetch(
        "https://my-messenger-backend.onrender.com/api/contacts/addContact",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json", // Ensure JSON content is specified
            Authorization: `Bearer ${jwt}`, // Include the JWT
          },
          body: JSON.stringify({
            contacts: [newContactEmail], // Send the new contact as an array
          }),
        }
      );
  
      if (response.ok) {
        const responseData = await response.json();
  
        // Update the state with the new contact
        setContacts((prevContacts) => [...prevContacts, newContactEmail]);
          
        alert("Contact added successfully!");
      } else {
        // Handle response errors
        const error = await response.json();
        alert(`Failed to add contact: ${error.message}`);
      }
    } catch (err) {
      console.error("Error adding contact:", err);
      alert("An error occurred while adding the contact.");
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    navigate("/signup");
  };

  // Function to handle selecting a contact
  const handleSelectContact = useCallback((contactEmail) => {
    setSelectedContact(contactEmail);
    fetchMessages(contactEmail);
  }, [fetchMessages]);

  // Function to handle sending a message
  const handleSendMessage = useCallback(() => {
    if (!socket || input.trim() === "" || !selectedContact) return;

    const newMessage = {
      content: input,
      sender: userEmail,
      createdAt: new Date(), // Store the Date object directly
    };

    const messageData = {
      token: jwt,
      receiver: selectedContact,
      content: input,
    };

    socket.emit('send_message', messageData);
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");
  }, [socket, input, selectedContact, userEmail, jwt]);

  // Memoize the contacts and messages to prevent unnecessary re-renders
  const memoizedContacts = useMemo(() => contacts, [contacts]);
  const memoizedMessages = useMemo(() => messages, [messages]);

  return (
    <div className="chat-screen">
      {/* Contact List Section */}
      <div className="contacts-section">
        <div className="contact-list">
          {memoizedContacts.map((email, index) => (
            <div
              key={index}
              className={`contact-item ${selectedContact === email ? "selected" : ""}`}
              onClick={() => handleSelectContact(email)}
            >
              <div className="contact-info">
                <p className="contact-name">{email}</p> {/* Render email directly */}
                <p className="contact-status">Offline</p>
              </div>
            </div>
          ))}
          {/* Add Contact Button */}
          <button className="add-contact-button" onClick={handleAddContact}>
            ➕ Add Contact
          </button>
        </div>
        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile">
            {/* <img
              src="https://via.placeholder.com/40"
              alt="Your Profile"
              className="profile-picture"
            /> */}
            
            <p className="profile-name">{userEmail}</p>
          </div>
          <button onClick={handleLogout} className="logout-button">
          Logout 🔐 
        </button>
          <button className="settings-button" onClick={() => navigate("/settings")}>
            ⚙️
          </button>
        </div>
      </div>

      {/* Chat Section */}
      <div className="chat-section">
        <div className="chat-header">
          <p className="chat-contact-name">
            {selectedContact || "Select a contact"}
          </p>
        </div>
        <div className="chat-messages">
          {memoizedMessages.map((message) => (
            <div
            key={message.id}
            className={`chat-message ${message.sender === userEmail ? "sent" : "received"}`}
            >
              <p className="message-text">{message.content}</p>
              <p className="message-timestamp">{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          ))}
          {/* Add a div to act as the end of the messages */}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-container">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="chat-input"
          />
          <button onClick={handleSendMessage} className="send-button">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
