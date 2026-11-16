// Configuration: the backend address lives in one place (it will change when we deploy)
const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
const API_URL = isLocal
  ? "http://127.0.0.1:8000/chat"
  : "https://permission-aware-rag-wm40.onrender.com/chat";
const REQUEST_TIMEOUT_MS = 30000; // must stay longer than the backend's Gemini timeout (20s)

const message = document.getElementById("message");
const question = document.getElementById("question");
const send = document.getElementById("send");
// Every link in a sanitized answer opens in a new tab, safely
DOMPurify.addHook("afterSanitizeAttributes", function (node) {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});
// Creates a chat bubble, adds it to the conversation, and returns it
function addBubble(text, role) {
  const bubble = document.createElement("div");
  bubble.classList.add("bubble", role);
  bubble.textContent = text;
  message.appendChild(bubble);
  message.scrollTop = message.scrollHeight;
  return bubble;
}

question.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    send.click();
  }
});

send.addEventListener("click", async function () {
  const text = question.value.trim();
  if (text === "") {
    alert("Please enter a question.");
    return;
  }
  const userBubble = addBubble(text, "user")
  const loading = addBubble("AdemPro is thinking...", "assistant");
  question.value = "";
  send.disabled = true;

  // Outer try: only here so that "finally" always re-enables the button
  try {
    // Declared outside phase 1 so phase 2 can use it (block scope)
    let responseMessage;

    // PHASE 1: the network request
    try {
      responseMessage = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (error.name === "TimeoutError") {
        console.error("Request timed out:", error);
        loading.textContent = "The assistant took too long to respond. Please try again.";
      } else {
        console.error("Network error:", error);
        loading.textContent = "Can't reach the assistant. Please try again.";
      }
      return; // stop here; the outer finally still runs
    }

    // PHASE 2: reading and displaying the response
    try {
      const type = responseMessage.headers.get("Content-Type");
      if (!type || !type.includes("application/json")) {
        console.error(
          "Response is not JSON:",
          responseMessage.status,
          await responseMessage.text(),
        );
        loading.textContent = "Something went wrong. Please try again.";
        return;
      }

      const responseData = await responseMessage.json();

      if (responseMessage.ok) {
        const unsafeHtml = marked.parse(responseData.answer);
        loading.innerHTML = DOMPurify.sanitize(unsafeHtml);
      } else if (typeof responseData.detail === "string") {
        loading.textContent = "Error: " + responseData.detail;
      } else {
        loading.textContent =
          "Your question couldn't be sent. Please check that it isn't empty or longer than 1000 characters.";
      }
    } catch (error) {
      console.error("Error displaying the response:", error);
      loading.textContent = "Something went wrong showing the answer. Please try again.";
    }
  } finally {
    send.disabled = false;
    userBubble.scrollIntoView({ block: "start", behavior: "smooth" });
  }
});