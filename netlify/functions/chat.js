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

    // Define the prompt using the user message and the assistant id.
    const prompt = message;

    // Call OpenAI's completions endpoint
    const response = await fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    const data = await response.json();
    if (data.error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.error.message })
      };
    }

    const reply = data.choices && data.choices.length > 0 ? data.choices[0].text.trim() : "No reply";

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
