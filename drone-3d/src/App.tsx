import { useState, useEffect, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [callCounter, setCallCounter] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
  };

  const url = 'https://api.together.xyz/v1/chat/completions';
  const apiKey = '';

  const fetchData = async (userMessage: ChatMessage) => {
    setCallCounter(callCounter + 1);
    console.log('Call counter: ', callCounter);
    setIsLoading(true);
    setError('');
    const data = {
      model: 'meta-llama/Llama-2-7b-chat-hf',
      max_tokens: 1024,
      messages: [...chatMessages, userMessage],
      stream_tokens: true,
      stop: ['</s>', '[/INST]']
    };
    try {
      await fetchEventSource(url, {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(data),
        onmessage(event) {
          if (event.data === "[DONE]"){
            setIsLoading(false);
            return;
          }
          const parsedData = JSON.parse(event.data);
          const newMessage = {role: "assistant", content: parsedData.choices[0].delta.content};
          setChatMessages(prevMessages => [...prevMessages, newMessage]);
        },
        onopen(res) {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
        },
      });
    } catch (err) {
      console.error("Fetch error: ", err);
      alert("Fetch error: " + err);
      setError('Error fetching response');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage?.role === 'user') {
      fetchData(lastMessage);
    }
  }, [chatMessages]);

  const handleInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && chatInput.trim()) {
      e.preventDefault();
      const newUserMessage = { role: 'user', content: chatInput };
      setChatMessages(prevMessages => [...prevMessages, newUserMessage]);
      setChatInput('');
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div id="chatBox">
      <div id="chatHeader">Chat</div>
      <div id="chatContent">
        {chatMessages.map((message, index) => (
          <div key={index} style={{ color: message.role === 'user' ? 'red' : 'lightgreen' }}>
            {message.role === 'user' ? 'User:' : 'Assistant:'} {message.content}
          </div>
        ))}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div ref={chatEndRef} />
      </div>
      <input 
        type="text" 
        id="chatInput" 
        placeholder="Type a message..." 
        value={chatInput} 
        onChange={handleInputChange} 
        onKeyDown={handleInputEnter} 
        disabled={isLoading}
      />
    </div>
  );
}

export default App;
