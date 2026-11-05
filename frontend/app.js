const message = document.getElementById('message');
const question = document.getElementById('question');
const send=document.getElementById('send');
send.addEventListener("click", async function () {
        if (question.value.trim() === '') {
            alert('Please enter a question.');
            return;
    }
    const request = document.createElement('p');
    request.textContent = 'you: ' + question.value;
    message.appendChild(request);
    const responseMessage = await fetch("http://127.0.0.1:8000/chat", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question: question.value })
    });
    const responseData = await responseMessage.json();
    if (responseMessage.ok) {
        const response = document.createElement('p');
        response.textContent = 'AdemPro: ' + responseData.answer;
        message.appendChild(response);
    }
    else {
        const errorResponse = document.createElement('p');
        errorResponse.textContent = 'Error: ' + responseData.detail;
        message.appendChild(errorResponse);
    }
    question.value = '';

});

