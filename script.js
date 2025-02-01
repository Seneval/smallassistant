document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("messages");

  function appendMessage(text, sender) {
    const messageElem = document.createElement("div");
    messageElem.className = sender;
    messageElem.textContent = text;
    messages.appendChild(messageElem);
    messages.scrollTop = messages.scrollHeight;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userMessage = input.value;
    appendMessage("You: " + userMessage, "user");
    input.value = "";
    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await response.json();
      if (data && data.reply) {
        appendMessage("Bot: " + data.reply, "bot");
      } else {
        appendMessage("Bot: No response from server", "bot");
      }
    } catch (error) {
      appendMessage("Bot: Error connecting to server", "bot");
    }
  });
});
