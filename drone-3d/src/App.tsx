import { useState, useEffect, useRef} from 'react';
import { fetchEventSource } from "@microsoft/fetch-event-source";
import './App.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
  };
  const url = 'https://api.together.xyz/v1/chat/completions';
  const apiKey = '';
  const fetchData = async (updatedMessages) => {
    let new_message: ChatMessage = {role: "assistant", content: ""}
    const data = {
      model: 'meta-llama/Llama-2-7b-chat-hf',
      max_tokens: 1024,
      messages: updatedMessages,
      stream_tokens: true
    };
    await fetchEventSource(url, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(data),
      onopen(res) {
        if (res.ok && res.status === 200) {
          console.log("Connection made ", res);
        } else if (
          res.status >= 400 &&
          res.status < 500 &&
          res.status !== 429
        ) {
          console.log("Client side error ", res);
        }
      },
      onmessage(event) {
        console.log(event.data);
        const parsedData = JSON.parse(event.data);
        new_message.content += parsedData.choices[0].delta.content;
        setChatMessages([...updatedMessages, new_message]);
      },
      onclose() {
        console.log("Connection closed by the server");
      },
      onerror(err) {
        console.log("There was an error from server", err);
      },
    });
    };

    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

  const handleInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newUserMessage = { role: 'user', content: chatInput };
      setChatMessages(prevMessages => {
        const updatedMessages = [...prevMessages, newUserMessage];
  
        // Now call fetchData here, passing the updatedMessages
        fetchData(updatedMessages);
  
        return updatedMessages;
      });

      setChatInput('');
      };

      
    };
  return (
    <div id="chatBox">
      <div id="chatHeader">Chat</div>
      <div id="chatContent">
        {chatMessages.map((message, index) => (
          <div key={index} style={{ color: message.role === 'user' ? 'red' : 'lightgreen' }}>
            {message.role === 'user' ? 'User:' : 'Inspector:'} {message.content}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <input 
        type="text" 
        id="chatInput" 
        placeholder="Type a message..." 
        value={chatInput} 
        onChange={handleInputChange} 
        onKeyDown={handleInputEnter} 
      />
    </div>
  );
}

export default App;
