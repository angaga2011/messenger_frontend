import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import io from 'socket.io-client';
import "../styles/ChatScreen.css";
import ContactsSection from "./ContactsSection";
import ChatSection from "./ChatSection";

const ChatScreen = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");
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

  // Scroll to the bottom of the chat when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // Function to navigate to settings
  const handleNavigateToSettings = () => {
    navigate("/settings");
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
      <ContactsSection
        contacts={memoizedContacts}
        selectedContact={selectedContact}
        onSelectContact={handleSelectContact}
        onAddContact={handleAddContact}
        handleLogout={handleLogout}
        handleNavigateToSettings={handleNavigateToSettings}
      />
      <ChatSection
        selectedContact={selectedContact}
        messages={memoizedMessages}
        input={input}
        setInput={setInput}
        onSendMessage={handleSendMessage}
        userEmail={userEmail}
        messagesEndRef={messagesEndRef}
      />
      {/* <div className="profile-section">
        <div className="profile">
          <p className="profile-name">{userEmail}</p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout 🔐 
        </button>
        <button className="settings-button" onClick={() => navigate("/settings")}>
          ⚙️
        </button>
      </div> */}
    </div>
  );
};

export default ChatScreen;
