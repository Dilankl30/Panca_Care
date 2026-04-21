const STORAGE_KEY = "mis_tareas_app";
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const dateInput = document.getElementById("dateInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const filterButtons = document.querySelectorAll(".filter-btn");
const menuButtons = document.querySelectorAll(".menu__item");
const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const completedCount = document.getElementById("completedCount");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

let tasks = loadTasks();
let currentFilter = "all";

init();

function init() {
  setTodayAsMinDate();
  renderTasks();
  bindEvents();
}

function bindEvents() {
  taskForm.addEventListener("submit", handleAddTask);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      updateActiveFilter(button);
      renderTasks();
    });
  });

  menuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.view;

      menuButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      if (view === "all") currentFilter = "all";
      if (view === "pending") currentFilter = "pending";
      if (view === "completed") currentFilter = "completed";

      syncFilterButtons();
      renderTasks();

      if (window.innerWidth <= 1023) {
        sidebar.classList.remove("show");
      }
    });
  });

  clearCompletedBtn.addEventListener("click", clearCompletedTasks);

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    const clickedInsideSidebar = sidebar.contains(e.target);
    const clickedMenuToggle = menuToggle.contains(e.target);

    if (
      window.innerWidth <= 1023 &&
      sidebar.classList.contains("show") &&
      !clickedInsideSidebar &&
      !clickedMenuToggle
    ) {
      sidebar.classList.remove("show");
    }
  });
}

function handleAddTask(event) {
  event.preventDefault();

  const title = taskInput.value.trim();
  const priority = priorityInput.value;
  const date = dateInput.value;

  if (!title || !date) return;

  const newTask = {
    id: crypto.randomUUID(),
    title,
    priority,
    date,
    completed: false,
    createdAt: Date.now()
  };

  tasks.unshift(newTask);
  saveTasks();
  renderTasks();
  taskForm.reset();
  priorityInput.value = "Media";
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function clearCompletedTasks() {
  const hasCompleted = tasks.some((task) => task.completed);
  if (!hasCompleted) return;

  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
}

function getFilteredTasks() {
  switch (currentFilter) {
    case "pending":
      return tasks.filter((task) => !task.completed);
    case "completed":
      return tasks.filter((task) => task.completed);
    default:
      return tasks;
  }
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();
  updateStats();

  taskList.innerHTML = "";

  if (filteredTasks.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  filteredTasks.forEach((task) => {
    const article = document.createElement("article");
    article.className = `task-item ${task.completed ? "completed" : ""}`;

    article.innerHTML = `
      <input 
        class="task-check" 
        type="checkbox" 
        aria-label="Completar tarea"
        ${task.completed ? "checked" : ""}
      />

      <div class="task-content">
        <p class="task-title">${escapeHTML(task.title)}</p>
        <div class="task-meta">
          <span class="badge ${task.priority.toLowerCase()}">${task.priority}</span>
        </div>
      </div>

      <div class="task-date">📅 ${formatDate(task.date)}</div>

      <div class="task-actions">
        <button class="action-btn complete-btn" title="Cambiar estado">✓</button>
        <button class="action-btn delete-btn" title="Eliminar">🗑️</button>
      </div>
    `;

    const checkbox = article.querySelector(".task-check");
    const completeBtn = article.querySelector(".complete-btn");
    const deleteBtn = article.querySelector(".delete-btn");

    checkbox.addEventListener("change", () => toggleTask(task.id));
    completeBtn.addEventListener("click", () => toggleTask(task.id));
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    taskList.appendChild(article);
  });
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;

  totalCount.textContent = total;
  pendingCount.textContent = pending;
  completedCount.textContent = completed;
}

function updateActiveFilter(activeButton) {
  filterButtons.forEach((btn) => btn.classList.remove("active"));
  activeButton.classList.add("active");
}

function syncFilterButtons() {
  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === currentFilter);
  });
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return [
      {
        id: crypto.randomUUID(),
        title: "Estudiar JavaScript",
        priority: "Media",
        date: "2024-05-24",
        completed: false,
        createdAt: Date.now()
      },
      {
        id: crypto.randomUUID(),
        title: "Diseñar la interfaz de la app",
        priority: "Alta",
        date: "2024-05-24",
        completed: false,
        createdAt: Date.now()
      },
      {
        id: crypto.randomUUID(),
        title: "Leer un capítulo del libro",
        priority: "Baja",
        date: "2024-05-25",
        completed: true,
        createdAt: Date.now()
      }
    ];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function setTodayAsMinDate() {
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("es-ES");
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}