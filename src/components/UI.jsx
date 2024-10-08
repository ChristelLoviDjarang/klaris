import React, { useRef, useState, useEffect } from "react";
// useChat is imported to access the chat context, which provides functionalities like sending messages, loading state, and managing camera zoom.
import { useChat } from "../hooks/useChat";

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const chatBoxRef = useRef(null);
  const { chat, loading, cameraZoomed, setCameraZoomed, message } = useChat();
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showPopup, setShowPopup] = useState(false); // State to control popup visibility
  const [isChatBoxVisible, setIsChatBoxVisible] = useState(true); // State to control chat box visibility
  const recognitionRef = useRef(null); // Ref to hold the SpeechRecognition instance

  useEffect(() => {
    // Initialize SpeechRecognition once
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        input.current.value = transcript;
        sendMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.error('Speech Recognition API is not supported in this browser.');
    }
  }, []);

  const sendMessage = async (text, from = "user") => {
    if (!text || text.trim() === "") {
      alert("Please enter a message."); // Updated alert message
      return;
    }
    if (!loading && !message) {
      setMessages(prevMessages => [...prevMessages, { text, from }]);
      input.current.value = "";

      try {
        // Send message to AI and get response
        const response = await fetchAIResponse(text);
        setMessages(prevMessages => [...prevMessages, { text: response, from: "ai" }]);

        // Generate speech from AI response
        speakText(response);
      } catch (error) {
        console.error('Error processing message:', error);
        setMessages(prevMessages => [...prevMessages, { text: "Maaf, terjadi kesalahan dalam memproses permintaan Anda.", from: "ai" }]);
      }
    }
  };

  const startSpeechRecognition = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  };

  const fetchAIResponse = async (text) => {
    try {
      const response = await fetch('/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: text }),
      });
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data.response;
    } catch (error) {
      console.error('Error fetching AI response:', error);
      throw error;
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error('Speech synthesis error', event);
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Speech synthesis not supported');
    }
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleShowPopup = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const toggleChatBox = () => {
    setIsChatBoxVisible(prev => !prev);
  };

  if (hidden) {
    return null;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
        <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-5 rounded-lg flex items-center">
          <img src="/klabat.png" alt="Small logo" className="w-6 h-6 mr-1 rounded-full" />
          <div>
            <h1 className="font-black text-sm">Your Personal AI Campus Assistant</h1>
            <p>Unklab for lyfe!<button onClick={handleShowPopup} className="text-white px-2 py-1 rounded-md pointer-events-auto">
            <img src="/AI.svg" alt="Credits Icon" className="inline-block w-5 h-5 mr-1" />
          </button></p>
          </div>
        </div>
        <div className="ww-full flex flex-col items-start justify-start gap-9 p-0 mt-4">
          <button onClick={toggleChatBox} className="bg-transparent text-white p-2 rounded-md pointer-events-auto">
            <img src="/chat.svg" alt="Chat Icon" className="w-6 h-6" />
          </button>
        </div>
        <div className="bg-white p-2 rounded-lg shadow-md flex items-center space-x-1 w-full md:w-1/2 mx-auto">
          <input
            className="flex-grow placeholder:text-gray-800 placeholder:italic p-2 cursor-text pointer-events-auto" // Added pointer-events-auto
            placeholder="Ask Klaris... "
            ref={input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage(input.current.value);
              }
            }}
            onFocus={() => input.current.select()} // Select the input text when focused
          />
           <button
            onClick={() => sendMessage(input.current.value)}
            className={`bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 font-semibold uppercase rounded-md transition-all duration-300 ease-in-out transform active:scale-95 sm:px-9 sm:py-4 ${
              loading || message ? "cursor-not-allowed opacity-30" : ""
            }`}
          >
            Send
          </button>
          <button
            onClick={startSpeechRecognition}
            className={`transition-all duration-300 ease-in-out transform active:scale-95 pointer-events-auto ${
              isListening ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            } text-white px-3 py-2 sm:py-4`}
            disabled={!recognitionRef.current || loading || message}
            title={recognitionRef.current ? "Start Recording" : "Speech Recognition Not Supported"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          </button>
        </div>
        {/* This div represents the chat box container */}
        {isChatBoxVisible && (
          <div className="fixed top-20 right-0 bottom-20 z-10 flex flex-col p-4 pointer-events-auto bg-white bg-opacity-40 backdrop-blur-md rounded-lg w-1/4 max-h-2/2">
            {/* Chat box title */}
            <h2 className="font-black text-xl mb-4">Chat Box</h2>
            {/* Scrollable container for chat messages */}
            <div ref={chatBoxRef} className="flex-grow overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {/* Map through messages array and render each message */}
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded-md mb-2 ${msg.from === "user" ? "bg-blue-200" : "bg-gray-200"}`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-start bg-black bg-opacity-50 z-20">
          <div className="bg-white p-4 rounded-lg shadow-lg m-4">
            <h2 className="font-bold text-lg">Post Credits</h2>
            <p>Developed by Rahayu,Ogi,Christel,Ruth,Mercy,Lovenchia,Jassy.</p>
            <p>Special thanks to supervisor Sir.Semmy T & Faculty of Computer Science Unklab! </p>
            <button onClick={handleClosePopup} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md">Close</button>
          </div>
        </div>
      )}
    </>
  );
};
