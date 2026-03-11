const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL || "https://api.siliconflow.cn/v1";
const model = process.env.OPENAI_MODEL || "Qwen/Qwen2-VL-7B-Instruct";

async function test() {
  console.log(`Testing with:
    URL: ${baseURL}
    Model: ${model}
    Key: ${apiKey ? apiKey.slice(0, 5) + '...' : 'Not Set'}
  `);

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10
      })
    });

    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Body:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
