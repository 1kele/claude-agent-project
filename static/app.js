const USER_ID_KEY = "chat_user_id";

let messages = [];

const appRoot = document.querySelector("#appRoot");
const authOverlay = document.querySelector("#authOverlay");
const authForm = document.querySelector("#authForm");
const authTitle = document.querySelector("#authTitle");
const authDescription = document.querySelector("#authDescription");
const authLogin = document.querySelector("#authLogin");
const authPassword = document.querySelector("#authPassword");
const authError = document.querySelector("#authError");
const authSubmit = document.querySelector("#authSubmit");
const authModeButton = document.querySelector("#authModeButton");
const adminButton = document.querySelector("#adminButton");
const adminPanel = document.querySelector("#adminPanel");
const closeAdminButton = document.querySelector("#closeAdminButton");
const adminStatus = document.querySelector("#adminStatus");
const adminUsersList = document.querySelector("#adminUsersList");
const adminProjectsList = document.querySelector("#adminProjectsList");
const adminUserProjects = document.querySelector("#adminUserProjects");
const userLookupForm = document.querySelector("#userLookupForm");
const lookupUserId = document.querySelector("#lookupUserId");
const grantAccessForm = document.querySelector("#grantAccessForm");
const grantUserId = document.querySelector("#grantUserId");
const grantUserLogin = document.querySelector("#grantUserLogin");
const grantProjectChoices = document.querySelector("#grantProjectChoices");
const addProjectForm = document.querySelector("#addProjectForm");
const newProjectName = document.querySelector("#newProjectName");
const newProjectDescription = document.querySelector("#newProjectDescription");
const refreshUsersButton = document.querySelector("#refreshUsersButton");
const refreshProjectsButton = document.querySelector("#refreshProjectsButton");
const chatHistory = document.querySelector("#chatHistory");
const emptyState = document.querySelector("#emptyState");
const fileList = document.querySelector("#fileList");
const userIdLabel = document.querySelector("#userIdLabel");
const projectSelect = document.querySelector("#projectSelect");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const sendButton = document.querySelector("#sendButton");
const newChatButton = document.querySelector("#newChatButton");
const saveChatButton = document.querySelector("#saveChatButton");
const loadFilesButton = document.querySelector("#loadFilesButton");
const logoutButton = document.querySelector("#logoutButton");

let userId = getOrCreateUserId();
let isSending = false;
let isAppLocked = true;
let hasProjects = false;
let isProjectsLoading = false;
let authMode = "register";
let currentLogin = "";
let currentRole = "";
let adminProjects = [];

updateUserIdLabel();
setAppLocked(true);
checkAuth();

authForm.addEventListener("submit", handleAuthSubmit);
authModeButton.addEventListener("click", toggleAuthMode);
adminButton.addEventListener("click", openAdminPanel);
closeAdminButton.addEventListener("click", closeAdminPanel);
refreshUsersButton.addEventListener("click", loadAdminUsers);
refreshProjectsButton.addEventListener("click", loadAdminProjects);
userLookupForm.addEventListener("submit", handleUserLookup);
grantAccessForm.addEventListener("submit", handleGrantAccess);
addProjectForm.addEventListener("submit", handleAddProject);
chatForm.addEventListener("submit", handleSubmit);
newChatButton.addEventListener("click", startNewChat);
saveChatButton.addEventListener("click", saveChat);
loadFilesButton.addEventListener("click", loadFiles);
logoutButton.addEventListener("click", handleLogout);
projectSelect.addEventListener("change", clearFileList);
messageInput.addEventListener("input", resizeMessageInput);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

async function checkAuth() {
  try {
    const response = await fetch("/auth/getme", {
      credentials: "include",
    });

    if (!response.ok) {
      showAuthOverlay();
      return;
    }

    const user = await response.json();
    setCurrentUser(user);
    updateUserIdLabel();
    await loadAllowedProjects();
    hideAuthOverlay();
  } catch (error) {
    showAuthOverlay();
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  const login = authLogin.value.trim();
  const password = authPassword.value;

  if (!login || !password) {
    showAuthError("Введите логин и пароль");
    return;
  }

  setAuthLoading(true);
  showAuthError("");

  try {
    if (authMode === "register") {
      const registerResponse = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ login, password }),
      });

      if (!registerResponse.ok) {
        throw new Error(await getResponseError(registerResponse, "Не удалось зарегистрироваться"));
      }
    }

    const loginResponse = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ login, password }),
    });

    if (!loginResponse.ok) {
      throw new Error(await getResponseError(loginResponse, "Не удалось войти"));
    }

    currentLogin = login;
    authForm.reset();
    await refreshCurrentUser();
    updateUserIdLabel();
    await loadAllowedProjects();
    hideAuthOverlay();
  } catch (error) {
    showAuthError(error.message);
  } finally {
    setAuthLoading(false);
  }
}

function toggleAuthMode() {
  setAuthMode(authMode === "register" ? "login" : "register");
}

function setAuthMode(nextAuthMode) {
  authMode = nextAuthMode;
  const isRegisterMode = authMode === "register";

  authTitle.textContent = isRegisterMode ? "Регистрация" : "Вход";
  authDescription.textContent = isRegisterMode
    ? "Создайте аккаунт, чтобы открыть чат."
    : "Войдите в аккаунт, чтобы открыть чат.";
  authSubmit.textContent = isRegisterMode ? "Зарегистрироваться" : "Войти";
  authModeButton.textContent = isRegisterMode ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться";
  authPassword.autocomplete = isRegisterMode ? "new-password" : "current-password";
  showAuthError("");
  authLogin.focus();
}

async function refreshCurrentUser() {
  const response = await fetch("/auth/getme", {
    credentials: "include",
  });

  if (!response.ok) {
    return;
  }

  const user = await response.json();
  setCurrentUser(user);
}

function setCurrentUser(responseData) {
  const user = responseData?.data || responseData || {};
  currentLogin = user.login || currentLogin || "";
  currentRole = user.role || "";
  updateAdminAvailability();
}

function updateAdminAvailability() {
  const isAdmin = currentRole === "admin";
  adminButton.hidden = !isAdmin;

  if (!isAdmin) {
    closeAdminPanel();
  }
}

async function handleLogout() {
  logoutButton.disabled = true;

  try {
    await fetch("/auth/logout", {
      method: "DELETE",
      credentials: "include",
    });
  } finally {
    currentLogin = "";
    currentRole = "";
    messages = [];
    hasProjects = false;
    authForm.reset();
    clearChat();
    clearFileList();
    updateAdminAvailability();
    renderProjectOptions([]);
    setAuthMode("login");
    updateUserIdLabel();
    showAuthOverlay();
  }
}

async function openAdminPanel() {
  adminPanel.hidden = false;
  chatHistory.hidden = true;
  chatForm.hidden = true;
  fileList.hidden = true;
  setAdminStatus("Загружаю данные...");

  await Promise.all([
    loadAdminUsers(),
    loadAdminProjects(),
  ]);
}

function closeAdminPanel() {
  adminPanel.hidden = true;
  chatHistory.hidden = false;
  chatForm.hidden = false;
  fileList.hidden = false;
}

async function loadAdminUsers() {
  try {
    setAdminStatus("Загружаю пользователей...");
    const data = await requestJson("/admin/users?page=1&per_page=29");
    renderAdminUsers(data?.data || []);
    setAdminStatus("Пользователи загружены");
  } catch (error) {
    renderAdminUsers([]);
    setAdminStatus(error.message);
  }
}

async function loadAdminProjects() {
  try {
    setAdminStatus("Загружаю проекты...");
    const data = await requestJson("/admin/projects?page=1&per_page=29");
    adminProjects = data?.data || [];
    renderAdminProjects(adminProjects);
    renderGrantProjectChoices(adminProjects);
    setAdminStatus("Проекты загружены");
  } catch (error) {
    adminProjects = [];
    renderAdminProjects([]);
    renderGrantProjectChoices([]);
    setAdminStatus(error.message);
  }
}

async function handleUserLookup(event) {
  event.preventDefault();

  const userId = lookupUserId.value.trim();

  if (!userId) {
    setAdminStatus("Укажите ID пользователя");
    return;
  }

  grantUserId.value = userId;
  await loadUserProjects(userId);
}

async function loadUserProjects(userId) {
  try {
    setAdminStatus("Загружаю доступы пользователя...");
    const data = await requestJson(`/admin/user?user_id=${encodeURIComponent(userId)}&page=1&per_page=29`);
    renderUserProjects(data?.data || []);
    setAdminStatus("Доступы пользователя загружены");
  } catch (error) {
    renderUserProjects([]);
    setAdminStatus(error.message);
  }
}

async function handleGrantAccess(event) {
  event.preventDefault();

  const userId = grantUserId.value.trim();
  const userLogin = grantUserLogin.value.trim();
  const selectedProjectIds = [...grantProjectChoices.querySelectorAll("input:checked")]
    .map((input) => Number(input.value))
    .filter(Boolean);

  if (!userId && !userLogin) {
    setAdminStatus("Укажите ID или логин пользователя");
    return;
  }

  if (selectedProjectIds.length === 0) {
    setAdminStatus("Выберите хотя бы один проект");
    return;
  }

  const params = new URLSearchParams();

  if (userId) {
    params.set("user_id", userId);
  } else {
    params.set("user_login", userLogin);
  }

  selectedProjectIds.forEach((projectId) => {
    params.append("allowed_projects", String(projectId));
  });

  try {
    setAdminStatus("Выдаю доступ...");
    await requestJson(`/admin?${params.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(selectedProjectIds),
    });

    setAdminStatus("Доступ выдан");
    grantAccessForm.reset();

    if (userId) {
      await loadUserProjects(userId);
    }

    await loadAllowedProjects();
  } catch (error) {
    setAdminStatus(error.message);
  }
}

async function handleAddProject(event) {
  event.preventDefault();

  const name = newProjectName.value.trim();
  const description = newProjectDescription.value.trim();

  if (!name || !description) {
    setAdminStatus("Заполните название и описание проекта");
    return;
  }

  try {
    setAdminStatus("Добавляю проект...");
    await requestJson("/admin/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, description }),
    });

    addProjectForm.reset();
    await loadAdminProjects();
    setAdminStatus("Проект добавлен");
  } catch (error) {
    setAdminStatus(error.message);
  }
}

async function deleteAdminProject(projectId) {
  if (!confirm("Удалить проект?")) {
    return;
  }

  try {
    setAdminStatus("Удаляю проект...");
    await requestJson(`/admin/projects/${projectId}`, {
      method: "DELETE",
    });
    await loadAdminProjects();
    await loadAllowedProjects();
    setAdminStatus("Проект удалён");
  } catch (error) {
    setAdminStatus(error.message);
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    throw new Error(await getResponseError(response, "Запрос не выполнен"));
  }

  return response.json();
}

function renderAdminUsers(users) {
  adminUsersList.innerHTML = "";

  if (users.length === 0) {
    adminUsersList.append(createAdminEmpty("Пользователи не найдены"));
    return;
  }

  users.forEach((user) => {
    const item = document.createElement("div");
    item.className = "admin-item";

    const body = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = `${user.login} #${user.id}`;
    const meta = document.createElement("span");
    meta.textContent = `${user.role} · ${user.is_active ? "active" : "blocked"}`;
    body.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "admin-item-actions";

    const projectsButton = document.createElement("button");
    projectsButton.className = "topbar-button";
    projectsButton.type = "button";
    projectsButton.textContent = "Проекты";
    projectsButton.addEventListener("click", () => {
      lookupUserId.value = user.id;
      grantUserId.value = user.id;
      loadUserProjects(user.id);
    });

    actions.append(projectsButton);
    item.append(body, actions);
    adminUsersList.append(item);
  });
}

function renderAdminProjects(projects) {
  adminProjectsList.innerHTML = "";

  if (projects.length === 0) {
    adminProjectsList.append(createAdminEmpty("Проекты не найдены"));
    return;
  }

  projects.forEach((project) => {
    const item = document.createElement("div");
    item.className = "admin-item";

    const body = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = `${project.name} #${project.id}`;
    const meta = document.createElement("span");
    meta.textContent = project.description || "Без описания";
    body.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "admin-item-actions";

    const deleteButton = document.createElement("button");
    deleteButton.className = "topbar-button logout-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Удалить";
    deleteButton.addEventListener("click", () => deleteAdminProject(project.id));

    actions.append(deleteButton);
    item.append(body, actions);
    adminProjectsList.append(item);
  });
}

function renderGrantProjectChoices(projects) {
  grantProjectChoices.innerHTML = "";

  if (projects.length === 0) {
    grantProjectChoices.append(createAdminEmpty("Сначала добавьте проекты"));
    return;
  }

  projects.forEach((project) => {
    const label = document.createElement("label");
    label.className = "admin-check";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = project.id;

    const text = document.createElement("span");
    text.textContent = project.name;

    label.append(input, text);
    grantProjectChoices.append(label);
  });
}

function renderUserProjects(users) {
  adminUserProjects.innerHTML = "";

  const user = users[0];

  if (!user) {
    adminUserProjects.append(createAdminEmpty("Пользователь не найден"));
    return;
  }

  const title = document.createElement("strong");
  title.textContent = `${user.login} #${user.id}`;

  const list = document.createElement("div");
  list.className = "admin-pills";

  if (!user.projects || user.projects.length === 0) {
    list.append(createAdminEmpty("Проектов пока нет"));
  } else {
    user.projects.forEach((project) => {
      const pill = document.createElement("span");
      pill.className = "admin-pill";
      pill.textContent = project.name;
      list.append(pill);
    });
  }

  adminUserProjects.append(title, list);
}

function createAdminEmpty(text) {
  const empty = document.createElement("span");
  empty.className = "admin-empty";
  empty.textContent = text;
  return empty;
}

function setAdminStatus(message) {
  adminStatus.textContent = message;
}

async function loadAllowedProjects() {
  isProjectsLoading = true;
  hasProjects = false;
  renderProjectLoading();
  applyControlsState();

  try {
    const response = await fetch("/chat", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(await getResponseError(response, "Не удалось загрузить проекты"));
    }

    const data = await response.json();
    const projects = normalizeProjects(data?.data || data);
    renderProjectOptions(projects);
  } catch (error) {
    renderProjectError(error.message);
  } finally {
    isProjectsLoading = false;
    applyControlsState();
  }
}

function normalizeProjects(projects) {
  if (!Array.isArray(projects)) {
    return [];
  }

  const normalizedProjects = [];

  projects.forEach((project) => {
    if (Array.isArray(project?.projects)) {
      project.projects.forEach((nestedProject) => {
        normalizedProjects.push(getProjectName(nestedProject));
      });
      return;
    }

    normalizedProjects.push(getProjectName(project));
  });

  return [...new Set(normalizedProjects.filter(Boolean))];
}

function getProjectName(project) {
  if (typeof project === "string") {
    return project;
  }

  return project?.project_name || project?.name || project?.project || "";
}

function renderProjectLoading() {
  projectSelect.innerHTML = "";
  projectSelect.append(createProjectOption("", "Загрузка проектов..."));
}

function renderProjectOptions(projects) {
  projectSelect.innerHTML = "";
  hasProjects = projects.length > 0;

  if (!hasProjects) {
    projectSelect.append(createProjectOption("", "Нет доступных проектов"));
    return;
  }

  projects.forEach((project) => {
    projectSelect.append(createProjectOption(project, project));
  });
}

function renderProjectError(message) {
  projectSelect.innerHTML = "";
  projectSelect.append(createProjectOption("", message || "Проекты недоступны"));
  hasProjects = false;
}

function createProjectOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function showAuthOverlay() {
  authOverlay.hidden = false;
  appRoot.classList.add("app--locked");
  appRoot.setAttribute("aria-hidden", "true");
  setAppLocked(true);
  setTimeout(() => authLogin.focus(), 0);
}

function hideAuthOverlay() {
  authOverlay.hidden = true;
  appRoot.classList.remove("app--locked");
  appRoot.removeAttribute("aria-hidden");
  setAppLocked(false);
  messageInput.focus();
}

function setAuthLoading(isLoading) {
  authSubmit.disabled = isLoading;
  authModeButton.disabled = isLoading;
  authLogin.disabled = isLoading;
  authPassword.disabled = isLoading;
  authSubmit.textContent = isLoading
    ? "Подождите..."
    : authMode === "register"
      ? "Зарегистрироваться"
      : "Войти";
}

function showAuthError(message) {
  authError.textContent = message;
  authError.hidden = !message;
}

async function getResponseError(response, fallbackMessage) {
  try {
    const data = await response.json();
    const detail = data?.detail || data?.message;

    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg || JSON.stringify(item)).join("; ");
    }

    if (detail && typeof detail === "object") {
      return JSON.stringify(detail);
    }

    return detail || fallbackMessage;
  } catch (error) {
    return fallbackMessage;
  }
}

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
  messages = [];
  messageInput.focus();
}

async function handleSubmit(event) {
  event.preventDefault();

  const prompt = messageInput.value.trim();
  const selectedProject = projectSelect.value;

  if (!prompt || !selectedProject || isSending) {
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
        file_path: selectedProject,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data?.result?.response || "Пустой ответ от сервера";
    pendingMessage.querySelector(".message-content").textContent = botResponse;

    messages.push({ role: "user", content: prompt });
    messages.push({ role: "bot", content: botResponse });
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
  applyControlsState();
}

function setAppLocked(nextIsLocked) {
  isAppLocked = nextIsLocked;
  applyControlsState();
}

function applyControlsState() {
  const isDisabled = isAppLocked || isSending;
  const isProjectUnavailable = !hasProjects || isProjectsLoading;

  sendButton.disabled = isDisabled || isProjectUnavailable;
  messageInput.disabled = isDisabled;
  projectSelect.disabled = isDisabled || isProjectUnavailable;
  newChatButton.disabled = isDisabled;
  saveChatButton.disabled = isDisabled || isProjectUnavailable;
  loadFilesButton.disabled = isDisabled || isProjectUnavailable;
  adminButton.disabled = isDisabled;
  logoutButton.disabled = isDisabled;
  sendButton.textContent = isSending ? "Отправка..." : "Отправить";
}

function resizeMessageInput() {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 180)}px`;
}

function updateUserIdLabel() {
  userIdLabel.textContent = currentLogin ? `${currentLogin} · user_id: ${userId}` : `user_id: ${userId}`;
  userIdLabel.title = userId;
}

async function saveChat() {
  const project = projectSelect.value;
  const chatId = userId;

  if (!project) {
    return;
  }

  const response = await fetch(`/chat/${project}/${chatId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_history: messages }),
  });

  if (!response.ok) {
    alert("Не удалось сохранить чат");
    return;
  }

  const filePath = await response.json();
  alert(`Сохранено: ${filePath}`);
}

async function loadFiles() {
  const project = projectSelect.value;

  if (!project) {
    return;
  }

  const response = await fetch(`/chat/${project}/files`);
  const files = await response.json();

  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "";

  files.forEach((filename) => {
    const chatId = filename.replace(".txt", "");

    const item = document.createElement("div");
    item.innerHTML = `
      <span>${filename}</span>
      <button onclick="downloadFile('${project}', '${chatId}')">Скачать</button>
      <button onclick="deleteFile('${project}', '${chatId}')">Удалить</button>
    `;
    fileList.appendChild(item);
  });
}

function clearFileList() {
  document.getElementById("fileList").innerHTML = "";
}

async function downloadFile(project, chatId) {
  window.location.href = `/chat/${project}/${chatId}`;
}

async function deleteFile(project, chatId) {
  await fetch(`/chat/${project}/${chatId}`, { method: "DELETE" });
  loadFiles();
}
