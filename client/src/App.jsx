// App.jsx
import React from "react";
import Chat from "./components/Chat";

function App() {
  return (
    <>
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <Chat />
      </div>
    </>
  );
}

export default App;
