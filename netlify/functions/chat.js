const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const { message } = JSON.parse(event.body);
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing 'message' in request body" })
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "OpenAI API key not configured" })
      };
    }

    // Set common headers for beta endpoints
    const headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey,
      "OpenAI-Beta": "assistants=v1"
    };

    // 1. Create a new thread
    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers
    });
    if (!threadRes.ok) {
      const errorMsg = await threadRes.text();
      return {
        statusCode: threadRes.status,
        body: JSON.stringify({ error: "Thread creation error: " + errorMsg })
      };
    }
    const threadData = await threadRes.json();
    const threadId = threadData.id;

    // 2. Add the user's message to the thread
    const messageRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        role: "user",
        content: message
      })
    });
    if (!messageRes.ok) {
      const errorMsg = await messageRes.text();
      return {
        statusCode: messageRes.status,
        body: JSON.stringify({ error: "Message creation error: " + errorMsg })
      };
    }

    // 3. Create a run for the assistant using your assistant ID
    const assistantId = "asst_fV1fdSuQipHMoPYAHCpHlw8p";
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });
    if (!runRes.ok) {
      const errorMsg = await runRes.text();
      return {
        statusCode: runRes.status,
        body: JSON.stringify({ error: "Run creation error: " + errorMsg })
      };
    }
    const runData = await runRes.json();
    const runId = runData.id;

    // 4. Poll the run status until it's completed
    let runStatus = "";
    while (true) {
      const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        method: "GET",
        headers
      });
      if (!statusRes.ok) {
        const errorMsg = await statusRes.text();
        return {
          statusCode: statusRes.status,
          body: JSON.stringify({ error: "Run status error: " + errorMsg })
        };
      }
      const statusData = await statusRes.json();
      runStatus = statusData.status;
      if (runStatus === "completed") {
        break;
      }
      if (runStatus === "failed") {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: "Assistant run failed" })
        };
      }
      // Wait for 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 5. Retrieve the messages from the thread
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "GET",
      headers
    });
    if (!messagesRes.ok) {
      const errorMsg = await messagesRes.text();
      return {
        statusCode: messagesRes.status,
        body: JSON.stringify({ error: "Retrieving messages error: " + errorMsg })
      };
    }
    const messagesData = await messagesRes.json();
    const messagesList = messagesData.data;
    if (!messagesList || messagesList.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No messages returned" })
      };
    }

    // 6. Extract the assistant's response from the latest message
    const lastMessage = messagesList[0];
    let reply = "No valid text response";
    if (lastMessage.content && Array.isArray(lastMessage.content) && lastMessage.content.length > 0) {
      const textContent = lastMessage.content.find(item => item.type === "text");
      if (textContent && textContent.text && textContent.text.value) {
        reply = textContent.text.value;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: reply })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
