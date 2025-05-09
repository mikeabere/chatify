// components/Chat.jsx
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import DOMPurify from "dompurify";
import CryptoJS from "crypto-js";
import Picker from "emoji-picker-react";

const socket = io("http://localhost:5000", {
  auth: {
    token: localStorage.getItem("token"),
  },
});

const secretKey = "secret123";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [usersOnline, setUsersOnline] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    socket.on("message", ({ sender, encryptedMsg }) => {
      const decrypted = CryptoJS.AES.decrypt(encryptedMsg, secretKey).toString(
        CryptoJS.enc.Utf8
      );
      setMessages((prev) => [...prev, { sender, text: decrypted }]);
    });

    socket.on("typing", (username) => {
      setTyping(username);
      setTimeout(() => setTyping(false), 2000);
    });

    socket.on("history", (history) => {
      const decryptedHistory = history.map(({ sender, encryptedMsg }) => ({
        sender,
        text: CryptoJS.AES.decrypt(encryptedMsg, secretKey).toString(
          CryptoJS.enc.Utf8
        ),
      }));
      setMessages(decryptedHistory);
    });

    socket.on("onlineUsers", (users) => {
      setUsersOnline(users);
    });

    socket.emit("getHistory");
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    const cleanInput = DOMPurify.sanitize(input);
    const encrypted = CryptoJS.AES.encrypt(cleanInput, secretKey).toString();
    socket.emit("message", encrypted);
    setInput("");
  };

  const handleTyping = () => {
    socket.emit("typing");
  };

  const onEmojiClick = ( emojiObject) => {
    setInput((prev) => prev + emojiObject.emoji);
  };

  return (
    <>
      <div className="w-full max-w-xl p-4 bg-gray-800 rounded-2xl shadow-xl">
        <div className="mb-2 text-sm text-green-400">
          Online: {usersOnline.join(", ")}
        </div>
        <div className="h-64 overflow-y-auto mb-4">
          {messages.map((msg, i) => (
            <div key={i} className="p-2 bg-gray-700 mb-1 rounded">
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
        </div>
        {typing && (
          <div className="text-xs text-gray-400 mb-2">
            {typing} is typing...
          </div>
        )}
        <div className="flex mb-2">
          <input
            className="flex-1 p-2 rounded-l bg-gray-600 focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleTyping}
            placeholder="Type a message..."
          />
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="bg-yellow-400 px-3"
          >
            😊
          </button>
          <button
            onClick={sendMessage}
            className="bg-blue-500 px-4 py-2 rounded-r hover:bg-blue-600"
          >
            Send
          </button>
        </div>
        {showEmojiPicker && <Picker onEmojiClick={onEmojiClick} />}
      </div>
    </>
  );
}

export default Chat;
