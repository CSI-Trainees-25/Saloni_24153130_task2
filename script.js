document.addEventListener("DOMContentLoaded", () => {
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  const taskContainer = document.querySelector(".tasks");
  const doNowContainer = document.querySelector(".do-now");
  const stats = document.querySelector(".stats");
  const createBtn = document.querySelector(".add-task .btn");
  const taskInput = document.querySelector(".add-task input[type='text']");
  const statusSelect = document.querySelector(".add-task select:first-of-type");
  const prioritySelect = document.querySelector(".add-task select:last-of-type");
  const dateInput = document.querySelector(".add-task input[type='date']");
  if(dateInput){
    const today = new Date().toISOString().split("T")[0];
    dateInput.setAttribute("min",today);
  }
  const durationInput = document.querySelector(".add-task input[type='number']");
  const addTaskForm = document.querySelector(".add-task");
  const toggleFormBtn = document.getElementById("toggle-form");

  if (toggleFormBtn) {
    toggleFormBtn.addEventListener("click", () =>
      addTaskForm.classList.toggle("hidden")
    );
  }

  function updateStats() {
    if (!stats || !doNowContainer) return;
    const inProgress = tasks.filter((t) => t.status === "In Progress");
    const done = tasks.filter((t) => t.status === "Done");
    stats.innerHTML = `<span>${tasks.length} Task</span>
      <span>${inProgress.length} In progress</span>
      <span>${done.length} Done</span>`;
    doNowContainer.querySelector(".do-header span").textContent = `${
      tasks.filter((t) => t.doNow).length
    }/${tasks.length}`;
  }

  function renderTasks() {
    if (!taskContainer || !doNowContainer) return;
    taskContainer.querySelectorAll(".task-card").forEach((el) => el.remove());
    doNowContainer.querySelectorAll(".do-card").forEach((el) => el.remove());

    tasks.forEach((task, index) => {
       
      const card = document.createElement("div");
      card.classList.add("task-card");
      card.dataset.id = task.id;
      card.setAttribute("draggable", true);
      card.innerHTML = `
        <h3>${task.name}</h3>
        <div class="row">
          <select>
            <option ${task.status === "Not Started" ? "selected" : ""}>Not Started</option>
            <option ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option ${task.status === "Done" ? "selected" : ""}>Done</option>
          </select>
          <select>
            <option ${task.priority === "Low" ? "selected" : ""}>Low</option>
            <option ${task.priority === "Medium" ? "selected" : ""}>Medium</option>
            <option ${task.priority === "High" ? "selected" : ""}>High</option>
          </select>
        </div>
        <p class="date">Due Date: ${task.dueDate}</p>
        <p>Duration: ${task.duration}s</p>
        ${!task.doNow ? `<button class="btn small">Move to Do Now →</button>` : ""}
        <button class="btn small remove-btn">Remove</button>
      `;

      card.querySelector("select:first-of-type").addEventListener("change", (e) => {
        task.status = e.target.value;
        saveTasks();
        updateStats();
      });

      card.querySelector("select:last-of-type").addEventListener("change", (e) => {
        task.priority = e.target.value;
        saveTasks();
      });

      card.querySelector(".remove-btn").addEventListener("click", () => {
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks();
        renderTasks();
      });

      if (!task.doNow)
        card.querySelector("button")?.addEventListener("click", () => {
          task.doNow = true;
          saveTasks();
          renderTasks();
        });

      card.addEventListener("dragstart", () => card.classList.add("dragging"));
      card.addEventListener("dragend", () => card.classList.remove("dragging"));
      taskContainer.appendChild(card);

     
      if (task.doNow) {
        const doCard = document.createElement("div");
        doCard.classList.add("do-card");
        doCard.dataset.id = task.id;
        doCard.setAttribute("draggable", true);
        
        

        doCard.innerHTML = `
          <h3>${task.name}</h3>
          <div class="row">
            <select>
              <option ${task.status === "Not Started" ? "selected" : ""}>Not Started</option>
              <option ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
              <option ${task.status === "Done" ? "selected" : ""}>Done</option>
            </select>
            <select>
              <option ${task.priority === "Low" ? "selected" : ""}>Low</option>
              <option ${task.priority === "Medium" ? "selected" : ""}>Medium</option>
              <option ${task.priority === "High" ? "selected" : ""}>High</option>
            </select>
          </div>
          <p class="date">Due Date: ${task.dueDate}</p>
          <p>Duration: ${task.duration}s</p>
          <button class="btn timer-btn">Start Task</button>
          <button class="btn remove-btn small">Remove</button>
        `;
        doCard.querySelector(".timer-btn").addEventListener("click", () => {
          const queue = tasks.filter((t) => t.doNow && t.status !=="Done" );
          localStorage.setItem("runnerQueue", JSON.stringify(queue));
          localStorage.setItem("runnerIndex", "0");
          window.location.href = "runner.html";
        });
        doCard.querySelector(".remove-btn").addEventListener("click", () => {
          tasks = tasks.filter(t => t.id !== task.id);
          saveTasks();
          renderTasks();
        });
        doCard.addEventListener("dragstart", () => doCard.classList.add("dragging"));
        doCard.addEventListener("dragend", () => doCard.classList.remove("dragging"));
        doNowContainer.appendChild(doCard);
      }
    });

    updateStats();
  }
  function initDragDrop(container) {
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      const dragging = document.querySelector(".dragging");
      if (!dragging) return;
      const afterElement = [...container.querySelectorAll(".task-card:not(.dragging), .do-card:not(.dragging)")]
        .reduce(
          (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = e.clientY - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset, element: child };
            return closest;
          },
          { offset: Number.NEGATIVE_INFINITY }
        ).element;
      if (!afterElement) container.appendChild(dragging);
      else container.insertBefore(dragging, afterElement);
    });

    container.addEventListener("drop", () => {
      const newTasks = [];
      [...taskContainer.querySelectorAll(".task-card"), ...doNowContainer.querySelectorAll(".do-card")].forEach(card => {
        const task = tasks.find(t => t.id === card.dataset.id);
        if (task && !newTasks.includes(task)) newTasks.push(task);
      });
      tasks = newTasks;
      saveTasks();
      renderTasks();
    });
  }

  if (createBtn) {
    createBtn.addEventListener("click", () => {
      const name = taskInput.value.trim();
      const status = statusSelect.value;
      const priority = prioritySelect.value;
      const dueDate = dateInput.value || "No due date";
      const duration = parseInt(durationInput.value);
      if (!name) {
        alert("Please enter task name.");
        return;
      }
      if (!duration || duration <= 0) {
        alert("Enter valid duration.");
        return;
      }
      tasks.push({
        id: Date.now().toString(), 
        name,
        status,
        priority,
        dueDate,
        duration,
        doNow: false,
        timeSpent: 0,
      });
      saveTasks();
      renderTasks();
      taskInput.value = "";
      dateInput.value = "";
      durationInput.value = "";
      addTaskForm.classList.add("hidden");
    });
  }

  if (taskContainer && doNowContainer) {
    initDragDrop(taskContainer);
    initDragDrop(doNowContainer);
    renderTasks();
  }

  
  const runnerTaskName = document.getElementById("runnerTaskName");
  const runnerTimer = document.getElementById("runnerTimer");
  const pauseBtn = document.getElementById("pauseBtn");
  const skipBtn = document.getElementById("skipBtn");
  const completeBtn = document.getElementById("completeBtn");
  const runnerTaskDetails = document.getElementById("runnerTaskDetails");

  if (runnerTaskName && runnerTimer && runnerTaskDetails) {
    let queue = JSON.parse(localStorage.getItem("runnerQueue")) || [];
    let index = parseInt(localStorage.getItem("runnerIndex") || "0", 10);

    if (queue.length === 0 || !queue[index]) {
      window.location.href = "summary.html";
      return;
    }

    let currentTask = queue[index];
    let timeLeft = currentTask.duration;
    let paused = false;
    let intervalId = null;
    let onBreak = false;

    function formatTime(sec) {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
        s
      ).padStart(2, "0")}`;
    }

    function updateRunnerUI() {
      runnerTaskName.textContent = onBreak ? "Break Time!" : currentTask.name;
      runnerTaskDetails.querySelectorAll("p").forEach(p => p.remove());

      if (onBreak) {
        const p = document.createElement("p");
        p.textContent = "Relax for 10 seconds before next task...";
        runnerTaskDetails.appendChild(p);
      } else {
        const props = [
          `Status: ${currentTask.status}`,
          `Priority: ${currentTask.priority}`,
          `Due Date: ${currentTask.dueDate}`,
          `Duration: ${currentTask.duration}s`
        ];
        props.forEach(text => {
          const p = document.createElement("p");
          p.textContent = text;
          runnerTaskDetails.appendChild(p);
        });
      }

      runnerTimer.textContent = formatTime(timeLeft);
    }

    function saveDoneTask() {
      tasks = tasks.map((t) =>
        t.id === currentTask.id
          ? { ...t, status: "Done", timeSpent: currentTask.duration - timeLeft }
          : t
      );
      saveTasks();
    }

    function nextTask() {
      clearInterval(intervalId);
      saveDoneTask();

      index++;
      localStorage.setItem("runnerIndex", index.toString());

      if (index >= queue.length) {
        localStorage.removeItem("runnerQueue");
        localStorage.removeItem("runnerIndex");
        window.location.href = "summary.html";
      } else {
        startBreak();
      }
    }

    function startBreak() {
      onBreak = true;
      timeLeft = 10;
      updateRunnerUI();

      intervalId = setInterval(() => {
        if (!paused) {
          if (timeLeft > 0) {
            timeLeft--;
            runnerTimer.textContent = formatTime(timeLeft);
          } else {
            clearInterval(intervalId);
            onBreak = false;
            currentTask = queue[index];
            timeLeft = currentTask.duration;
            updateRunnerUI();
            startTimer();
          }
        }
      }, 1000);
    }

    function startTimer() {
      updateRunnerUI();
      intervalId = setInterval(() => {
        if (!paused) {
          if (timeLeft > 0) {
            timeLeft--;
            runnerTimer.textContent = formatTime(timeLeft);
          } else {
            nextTask();
          }
        }
      }, 1000);
    }

    pauseBtn.onclick = () => {
      paused = !paused;
      pauseBtn.textContent = paused ? "Resume" : "Pause";
    };
    skipBtn.onclick = nextTask;
    completeBtn.onclick = nextTask;

    startTimer();
  }

  
  const summaryContainer = document.getElementById("summary-container");
  if (summaryContainer) {
    const doneTasks = tasks.filter((t) => t.status === "Done");
    doneTasks.forEach((task) => {
      if (!document.getElementById(`summary-${task.id}`)) {
        const div = document.createElement("div");
        div.id = `summary-${task.id}`;
        div.classList.add("task-card");
        div.innerHTML = `<h3>${task.name}</h3>
          <p>Status: ${task.status}</p>
          <p>Time Spent: ${task.timeSpent}s</p>`;
        summaryContainer.appendChild(div);
      }
    });

    document.getElementById("back-btn")?.addEventListener("click", () => {
      window.location.href = "index.html";
    });

    document.getElementById("reset")?.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "index.html";
    });
  }
});