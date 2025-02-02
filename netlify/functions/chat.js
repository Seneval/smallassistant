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

    // Use the OpenAI Assistant API with the specified assistant id.
    const response = await fetch("https://api.openai.com/v1/assistants/asst_fV1fdSuQipHMoPYAHCpHlw8p/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        message: message,
        max_tokens: 150,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.error.message })
      };
    }

    const reply = data.reply ? data.reply.trim() : "No reply";
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
