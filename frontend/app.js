const message = document.getElementById("message");
const question = document.getElementById("question");
const send = document.getElementById("send");
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
  addBubble(text, "user");
  const loading = addBubble("AdemPro is thinking...", "assistant");
  question.value = "";
  send.disabled = true;
  try {
    const responseMessage = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: text }),
    });
    const type = responseMessage.headers.get("Content-Type");
    if (!type || !type.includes("application/json")) {
      console.error(
        "Response is not JSON:",
        responseMessage.status,
        await responseMessage.text(),
      );
      loading.textContent = "Error: Something went wrong. Please try again.";
      return;
    }
    const responseData = await responseMessage.json();
    if (responseMessage.ok) {
      loading.textContent = responseData.answer;
    } else {
        if (typeof responseData.detail !== "string") {
            loading.textContent = "Error: Your question couldn’t be sent. Please check that it isn’t empty or longer than 1000 characters.";
        } else {
            loading.textContent = "Error: " + responseData.detail;
        }
    }
  } catch (error) {
    console.error("Error fetching chat response:", error);
    loading.textContent = "Can't reach the assistant. Please try again.";
  } finally {
    send.disabled = false;
    message.scrollTop = message.scrollHeight;
  }
});
