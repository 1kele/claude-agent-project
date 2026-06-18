const USER_ID_KEY = "chat_user_id";

const chatHistory = document.querySelector("#chatHistory");
const emptyState = document.querySelector("#emptyState");
const userIdLabel = document.querySelector("#userIdLabel");
const projectSelect = document.querySelector("#projectSelect");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const newChatButton = document.querySelector("#newChatButton");

let userId = getOrCreateUserId();
let isSending = false;

updateUserIdLabel();

chatForm.addEventListener("submit", handleSubmit);
newChatButton.addEventListener("click", startNewChat);
messageInput.addEventListener("input", resizeMessageInput);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

function getOrCreateUserId() {
  const savedUserId = localStorage.getItem(USER_ID_KEY);

  if (savedUserId) {
    return savedUserId;
  }

  const nextUserId = createUuid();
  localStorage.setItem(USER_ID_KEY, nextUserId);
  return nextUserId;
}

function createUuid() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) => {
    const randomValue = crypto.getRandomValues(new Uint8Array(1))[0];
    return (Number(char) ^ (randomValue & (15 >> (Number(char) / 4)))).toString(16);
  });
}

function startNewChat() {
  userId = createUuid();
  localStorage.setItem(USER_ID_KEY, userId);
  updateUserIdLabel();
  clearChat();
  messageInput.focus();
}

async function handleSubmit(event) {
  event.preventDefault();

  const prompt = messageInput.value.trim();

  if (!prompt || isSending) {
    return;
  }

  appendMessage("user", prompt);
  messageInput.value = "";
  resizeMessageInput();
  setSending(true);

  const pendingMessage = appendMessage("bot", "Печатает...");

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        prompt,
        file_path: projectSelect.value || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data?.result?.response || "Пустой ответ от сервера";
    pendingMessage.querySelector(".message-content").textContent = botResponse;
  } catch (error) {
    pendingMessage.classList.add("error");
    pendingMessage.querySelector(".message-content").textContent = `Ошибка отправки: ${error.message}`;
  } finally {
    setSending(false);
    messageInput.focus();
  }
}

function appendMessage(role, text) {
  emptyState.hidden = true;

  const message = document.createElement("article");
  message.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "Вы" : "AI";

  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = text;

  message.append(avatar, content);
  chatHistory.append(message);
  message.scrollIntoView({ behavior: "smooth", block: "end" });

  return message;
}

function clearChat() {
  chatHistory.querySelectorAll(".message").forEach((message) => message.remove());
  emptyState.hidden = false;
}

function setSending(nextIsSending) {
  isSending = nextIsSending;
  sendButton.disabled = nextIsSending;
  messageInput.disabled = nextIsSending;
  projectSelect.disabled = nextIsSending;
  newChatButton.disabled = nextIsSending;
  sendButton.textContent = nextIsSending ? "Отправка..." : "Отправить";
}

function resizeMessageInput() {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 180)}px`;
}

function updateUserIdLabel() {
  userIdLabel.textContent = `user_id: ${userId}`;
  userIdLabel.title = userId;
}