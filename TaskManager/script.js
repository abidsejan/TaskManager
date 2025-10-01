document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sidebar = document.querySelector('.sidebar');
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view');
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search');
    const notificationBtn = document.getElementById('notification-btn');
    const notificationDropdown = document.getElementById('notification-dropdown');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const addTaskBtn = document.getElementById('add-task-btn');
    const addTaskModal = document.getElementById('add-task-modal');
    const editTaskModal = document.getElementById('edit-task-modal');
    const taskForm = document.getElementById('task-form');
    const editForm = document.getElementById('edit-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const editCancelBtn = document.getElementById('edit-cancel-btn');
    const closeModalBtns = document.querySelectorAll('.close');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const sortSelect = document.getElementById('sort');
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const upcomingTasks = document.getElementById('upcoming-tasks');
    const calendarTaskList = document.getElementById('calendar-task-list');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentMonthEl = document.getElementById('current-month');
    const calendarGrid = document.querySelector('.calendar-grid');
    const selectedDateEl = document.getElementById('selected-date');
    const notificationPermissionModal = document.getElementById('notification-permission-modal');
    const allowNotificationsBtn = document.getElementById('allow-notifications');
    const denyNotificationsBtn = document.getElementById('deny-notifications');
    
    // Stats elements
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const overdueTasksEl = document.getElementById('overdue-tasks');
    const progressFillEl = document.getElementById('progress-fill');
    const progressPercentageEl = document.getElementById('progress-percentage');
    const progressTextEl = document.getElementById('progress-text');
    
    // Initialize tasks from localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentSort = 'date-added';
    let currentView = 'dashboard';
    let currentDate = new Date();
    let selectedDate = new Date();
    let notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    
    // Initialize app
    renderDashboard();
    renderTasks();
    renderCalendar();
    renderAnalytics();
    
    // Check for notification permission
    if (!notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
        notificationPermissionModal.style.display = 'block';
    }
    
    // Set up notification check interval
    setInterval(checkTaskReminders, 60000); // Check every minute
    
    // Event Listeners
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            switchView(view);
        });
    });
    
    themeToggle.addEventListener('click', toggleTheme);
    
    searchInput.addEventListener('input', handleSearch);
    
    notificationBtn.addEventListener('click', () => {
        notificationDropdown.style.display = notificationDropdown.style.display === 'block' ? 'none' : 'block';
    });
    
    document.addEventListener('click', (e) => {
        if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
            notificationDropdown.style.display = 'none';
        }
    });
    
    exportBtn.addEventListener('click', exportTasks);
    
    importBtn.addEventListener('click', () => {
        importFile.click();
    });
    
    importFile.addEventListener('change', importTasks);
    
    addTaskBtn.addEventListener('click', () => {
        taskForm.reset();
        document.getElementById('task-id').value = '';
        addTaskModal.style.display = 'block';
    });
    
    taskForm.addEventListener('submit', addTask);
    
    editForm.addEventListener('submit', updateTask);
    
    cancelBtn.addEventListener('click', () => {
        addTaskModal.style.display = 'none';
    });
    
    editCancelBtn.addEventListener('click', () => {
        editTaskModal.style.display = 'none';
    });
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
    
    sortSelect.addEventListener('change', () => setSort(sortSelect.value));
    
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    allowNotificationsBtn.addEventListener('click', () => {
        requestNotificationPermission();
        notificationPermissionModal.style.display = 'none';
    });
    
    denyNotificationsBtn.addEventListener('click', () => {
        notificationPermissionModal.style.display = 'none';
    });
    
    // Functions
    function switchView(view) {
        currentView = view;
        
        // Update nav links
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === view) {
                link.classList.add('active');
            }
        });
        
        // Update views
        views.forEach(v => {
            v.classList.remove('active');
            if (v.id === `${view}-view`) {
                v.classList.add('active');
            }
        });
        
        // Update header title
        document.querySelector('.header-left h2').textContent = 
            view.charAt(0).toUpperCase() + view.slice(1);
        
        // Render view-specific content
        if (view === 'dashboard') {
            renderDashboard();
        } else if (view === 'tasks') {
            renderTasks();
        } else if (view === 'calendar') {
            renderCalendar();
        } else if (view === 'analytics') {
            renderAnalytics();
        }
    }
    
    function toggleTheme() {
        const body = document.body;
        const themeIcon = themeToggle.querySelector('i');
        
        if (body.getAttribute('data-theme') === 'dark') {
            body.removeAttribute('data-theme');
            themeIcon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        }
    }
    
    function addTask(e) {
        e.preventDefault();
        
        const id = document.getElementById('task-id').value;
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const dueDate = document.getElementById('due-date').value;
        const dueTime = document.getElementById('due-time').value;
        const priority = document.getElementById('priority').value;
        const category = document.getElementById('category').value;
        const tags = document.getElementById('tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        const reminder = document.getElementById('reminder').value;
        
        if (id) {
            // Update existing task
            tasks = tasks.map(task => {
                if (task.id == id) {
                    return {
                        ...task,
                        title,
                        description,
                        dueDate,
                        dueTime,
                        priority,
                        category,
                        tags,
                        reminder,
                        updatedAt: new Date().toISOString()
                    };
                }
                return task;
            });
        } else {
            // Add new task
            const newTask = {
                id: Date.now(),
                title,
                description,
                dueDate,
                dueTime,
                priority,
                category,
                tags,
                reminder,
                completed: false,
                dateAdded: new Date().toISOString()
            };
            
            tasks.push(newTask);
        }
        
        saveTasks();
        addTaskModal.style.display = 'none';
        
        // Refresh current view
        if (currentView === 'dashboard') {
            renderDashboard();
        } else if (currentView === 'tasks') {
            renderTasks();
        } else if (currentView === 'calendar') {
            renderCalendar();
        }
    }
    
    function updateTask(e) {
        e.preventDefault();
        
        const id = parseInt(document.getElementById('edit-id').value);
        const title = document.getElementById('edit-title').value;
        const description = document.getElementById('edit-description').value;
        const dueDate = document.getElementById('edit-due-date').value;
        const dueTime = document.getElementById('edit-due-time').value;
        const priority = document.getElementById('edit-priority').value;
        const category = document.getElementById('edit-category').value;
        const tags = document.getElementById('edit-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        const reminder = document.getElementById('edit-reminder').value;
        
        tasks = tasks.map(task => {
            if (task.id === id) {
                return {
                    ...task,
                    title,
                    description,
                    dueDate,
                    dueTime,
                    priority,
                    category,
                    tags,
                    reminder,
                    updatedAt: new Date().toISOString()
                };
            }
            return task;
        });
        
        saveTasks();
        editTaskModal.style.display = 'none';
        
        // Refresh current view
        if (currentView === 'dashboard') {
            renderDashboard();
        } else if (currentView === 'tasks') {
            renderTasks();
        } else if (currentView === 'calendar') {
            renderCalendar();
        }
    }
    
    function renderTasks() {
        taskList.innerHTML = '';
        
        // Filter tasks
        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        } else if (currentFilter === 'overdue') {
            filteredTasks = tasks.filter(task => {
                return !task.completed && isTaskOverdue(task);
            });
        }
        
        // Sort tasks
        filteredTasks = sortTasks(filteredTasks, currentSort);
        
        // Search tasks
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchTerm) || 
                task.description.toLowerCase().includes(searchTerm) ||
                (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }
        
        // Render tasks or empty state
        if (filteredTasks.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            filteredTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                taskList.appendChild(taskElement);
            });
            
            // Add drag and drop functionality
            addDragAndDrop();
        }
    }
    
    function createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.draggable = true;
        taskItem.dataset.id = task.id;
        
        const priorityClass = `priority-${task.priority}`;
        const isOverdue = !task.completed && isTaskOverdue(task);
        
        if (isOverdue) {
            taskItem.classList.add('overdue');
        }
        
        // Format due date and time
        let dueDateTime = 'No due date';
        if (task.dueDate) {
            const dateObj = new Date(task.dueDate);
            const dateStr = dateObj.toLocaleDateString();
            
            if (task.dueTime) {
                const [hours, minutes] = task.dueTime.split(':');
                dateObj.setHours(hours, minutes);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                dueDateTime = `${dateStr} at ${timeStr}`;
            } else {
                dueDateTime = dateStr;
            }
        }
        
        let tagsHtml = '';
        if (task.tags && task.tags.length > 0) {
            tagsHtml = task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('');
        }
        
        taskItem.innerHTML = `
            <div class="task-header">
                <div>
                    <h3 class="task-title">${task.title}</h3>
                    <span class="task-priority ${priorityClass}">${task.priority}</span>
                </div>
            </div>
            <p class="task-description">${task.description}</p>
            <div class="task-meta">
                <div class="task-meta-left">
                    <span class="task-category">${task.category}</span>
                    <span class="task-due-date">
                        <i class="far fa-calendar"></i> ${dueDateTime}
                    </span>
                    <div class="task-tags">${tagsHtml}</div>
                </div>
                <div class="task-actions">
                    <button class="complete-btn" data-id="${task.id}" title="${task.completed ? 'Mark as active' : 'Mark as complete'}">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="reminder-btn" data-id="${task.id}" title="Set reminder">
                        <i class="fas fa-bell"></i>
                    </button>
                    <button class="edit-btn" data-id="${task.id}" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${task.id}" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners to buttons
        const completeBtn = taskItem.querySelector('.complete-btn');
        const editBtn = taskItem.querySelector('.edit-btn');
        const deleteBtn = taskItem.querySelector('.delete-btn');
        const reminderBtn = taskItem.querySelector('.reminder-btn');
        
        completeBtn.addEventListener('click', () => toggleTaskStatus(task.id));
        editBtn.addEventListener('click', () => openEditModal(task));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        reminderBtn.addEventListener('click', () => setReminder(task.id));
        
        return taskItem;
    }
    
    function isTaskOverdue(task) {
        if (!task.dueDate) return false;
        
        const now = new Date();
        const dueDate = new Date(task.dueDate);
        
        // If time is set, include it in the comparison
        if (task.dueTime) {
            const [hours, minutes] = task.dueTime.split(':');
            dueDate.setHours(hours, minutes);
        } else {
            // If no time is set, consider it overdue if the current date is past the due date
            dueDate.setHours(23, 59, 59, 999);
        }
        
        return now > dueDate;
    }
    
    function addDragAndDrop() {
        const taskItems = document.querySelectorAll('.task-item');
        
        taskItems.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
        });
    }
    
    let draggedElement = null;
    
    function handleDragStart(e) {
        draggedElement = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
    }
    
    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }
    
    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        
        if (draggedElement !== this) {
            const draggedId = parseInt(draggedElement.dataset.id);
            const targetId = parseInt(this.dataset.id);
            
            // Reorder tasks array
            const draggedIndex = tasks.findIndex(task => task.id === draggedId);
            const targetIndex = tasks.findIndex(task => task.id === targetId);
            
            if (draggedIndex !== -1 && targetIndex !== -1) {
                const [removed] = tasks.splice(draggedIndex, 1);
                tasks.splice(targetIndex, 0, removed);
                
                saveTasks();
                renderTasks();
            }
        }
        
        return false;
    }
    
    function handleDragEnd(e) {
        this.classList.remove('dragging');
    }
    
    function toggleTaskStatus(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveTasks();
        
        // Refresh current view
        if (currentView === 'dashboard') {
            renderDashboard();
        } else if (currentView === 'tasks') {
            renderTasks();
        } else if (currentView === 'calendar') {
            renderCalendar();
        }
    }
    
    function deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            
            // Refresh current view
            if (currentView === 'dashboard') {
                renderDashboard();
            } else if (currentView === 'tasks') {
                renderTasks();
            } else if (currentView === 'calendar') {
                renderCalendar();
            }
        }
    }
    
    function openEditModal(task) {
        document.getElementById('edit-id').value = task.id;
        document.getElementById('edit-title').value = task.title;
        document.getElementById('edit-description').value = task.description;
        document.getElementById('edit-due-date').value = task.dueDate || '';
        document.getElementById('edit-due-time').value = task.dueTime || '';
        document.getElementById('edit-priority').value = task.priority;
        document.getElementById('edit-category').value = task.category;
        document.getElementById('edit-tags').value = (task.tags || []).join(', ');
        document.getElementById('edit-reminder').value = task.reminder || 'none';
        
        editTaskModal.style.display = 'block';
    }
    
    function setReminder(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const reminderTime = prompt('Set reminder time (in minutes before due date):', '30');
            if (reminderTime && !isNaN(reminderTime)) {
                tasks = tasks.map(t => {
                    if (t.id === id) {
                        return { ...t, reminder: `${reminderTime}min` };
                    }
                    return t;
                });
                saveTasks();
                
                // Show notification
                showNotification('Reminder set', `Reminder set for "${task.title}" ${reminderTime} minutes before due date.`);
            }
        }
    }
    
    function setFilter(filter) {
        currentFilter = filter;
        filterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        renderTasks();
    }
    
    function setSort(sort) {
        currentSort = sort;
        renderTasks();
    }
    
    function sortTasks(tasks, sortMethod) {
        const sortedTasks = [...tasks];
        
        switch (sortMethod) {
            case 'date-added':
                return sortedTasks.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            case 'due-date':
                return sortedTasks.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    
                    const dateA = new Date(a.dueDate);
                    const dateB = new Date(b.dueDate);
                    
                    // If dates are the same, compare times
                    if (dateA.getTime() === dateB.getTime()) {
                        if (!a.dueTime) return 1;
                        if (!b.dueTime) return -1;
                        
                        const [hoursA, minutesA] = a.dueTime.split(':').map(Number);
                        const [hoursB, minutesB] = b.dueTime.split(':').map(Number);
                        
                        const timeA = new Date(0, 0, 0, hoursA, minutesA);
                        const timeB = new Date(0, 0, 0, hoursB, minutesB);
                        
                        return timeA - timeB;
                    }
                    
                    return dateA - dateB;
                });
            case 'priority':
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                return sortedTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            case 'title':
                return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
            default:
                return sortedTasks;
        }
    }
    
    function handleSearch() {
        if (currentView === 'tasks') {
            renderTasks();
        } else if (currentView === 'dashboard') {
            renderUpcomingTasks();
        }
    }
    
    function renderDashboard() {
        // Update stats
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const overdueTasks = tasks.filter(task => {
            return !task.completed && isTaskOverdue(task);
        }).length;
        
        totalTasksEl.textContent = totalTasks;
        completedTasksEl.textContent = completedTasks;
        pendingTasksEl.textContent = pendingTasks;
        overdueTasksEl.textContent = overdueTasks;
        
        // Update progress
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayTasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= today && dueDate < tomorrow;
        });
        
        const todayCompleted = todayTasks.filter(task => task.completed).length;
        const progressPercentage = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;
        
        progressFillEl.style.width = `${progressPercentage}%`;
        progressPercentageEl.textContent = `${progressPercentage}%`;
        progressTextEl.textContent = `${todayCompleted} of ${todayTasks.length} tasks completed`;
        
        // Update category counts
        const categories = ['personal', 'work', 'shopping', 'health', 'other'];
        categories.forEach(category => {
            const count = tasks.filter(task => task.category === category).length;
            const categoryCard = document.querySelector(`.category-card[data-category="${category}"]`);
            if (categoryCard) {
                categoryCard.querySelector('.category-count').textContent = `${count} tasks`;
            }
        });
        
        // Render upcoming tasks
        renderUpcomingTasks();
    }
    
    function renderUpcomingTasks() {
        upcomingTasks.innerHTML = '';
        
        // Get upcoming tasks (next 7 days)
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        let upcomingTasksList = tasks.filter(task => {
            if (!task.dueDate || task.completed) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate >= today && dueDate <= nextWeek;
        });
        
        // Sort by due date and time
        upcomingTasksList.sort((a, b) => {
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            
            // If dates are the same, compare times
            if (a.dueTime && b.dueTime) {
                const [hoursA, minutesA] = a.dueTime.split(':').map(Number);
                const [hoursB, minutesB] = b.dueTime.split(':').map(Number);
                
                const timeA = new Date(0, 0, 0, hoursA, minutesA);
                const timeB = new Date(0, 0, 0, hoursB, minutesB);
                
                return timeA - timeB;
            }
            
            return 0;
        });
        
        // Limit to 5 tasks
        upcomingTasksList = upcomingTasksList.slice(0, 5);
        
        // Apply search if needed
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            upcomingTasksList = upcomingTasksList.filter(task => 
                task.title.toLowerCase().includes(searchTerm) || 
                task.description.toLowerCase().includes(searchTerm)
            );
        }
        
        if (upcomingTasksList.length === 0) {
            upcomingTasks.innerHTML = '<p class="empty-state">No upcoming tasks in the next 7 days.</p>';
        } else {
            upcomingTasksList.forEach(task => {
                const taskElement = createTaskElement(task);
                upcomingTasks.appendChild(taskElement);
            });
        }
    }
    
    function renderCalendar() {
        // Update month display
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        currentMonthEl.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        
        // Clear calendar grid (except headers)
        const dayHeaders = calendarGrid.querySelectorAll('.calendar-day-header');
        calendarGrid.innerHTML = '';
        dayHeaders.forEach(header => calendarGrid.appendChild(header));
        
        // Get first day of month and number of days
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Get previous month's days for display
        const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        const daysInPrevMonth = prevMonthLastDay.getDate();
        
        // Add previous month's days
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const dayElement = createCalendarDay(day, true, new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day));
            calendarGrid.appendChild(dayElement);
        }
        
        // Add current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dayElement = createCalendarDay(i, false, date);
            calendarGrid.appendChild(dayElement);
        }
        
        // Add next month's days to fill grid
        const totalCells = calendarGrid.children.length - 7; // Subtract headers
        const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42
        for (let i = 1; i <= remainingCells; i++) {
            const dayElement = createCalendarDay(i, true, new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i));
            calendarGrid.appendChild(dayElement);
        }
        
        // Render tasks for selected date
        renderCalendarTasks();
    }
    
    function createCalendarDay(day, isOtherMonth, date) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        // Check if today
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Check if selected
        if (date.toDateString() === selectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Add task indicators
        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'calendar-day-tasks';
        
        // Get tasks for this day
        const dayTasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate.toDateString() === date.toDateString();
        });
        
        // Add up to 3 indicators
        dayTasks.slice(0, 3).forEach(task => {
            const indicator = document.createElement('div');
            indicator.className = `calendar-day-task ${task.priority}`;
            tasksContainer.appendChild(indicator);
        });
        
        dayElement.appendChild(tasksContainer);
        
        // Add click event
        dayElement.addEventListener('click', () => {
            selectedDate = new Date(date);
            renderCalendar();
            renderCalendarTasks();
        });
        
        return dayElement;
    }
    
    function renderCalendarTasks() {
        calendarTaskList.innerHTML = '';
        
        // Format selected date
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        selectedDateEl.textContent = selectedDate.toLocaleDateString(undefined, options);
        
        // Get tasks for selected date
        const dayTasks = tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate.toDateString() === selectedDate.toDateString();
        });
        
        // Sort tasks by time
        dayTasks.sort((a, b) => {
            if (!a.dueTime) return 1;
            if (!b.dueTime) return -1;
            
            const [hoursA, minutesA] = a.dueTime.split(':').map(Number);
            const [hoursB, minutesB] = b.dueTime.split(':').map(Number);
            
            const timeA = new Date(0, 0, 0, hoursA, minutesA);
            const timeB = new Date(0, 0, 0, hoursB, minutesB);
            
            return timeA - timeB;
        });
        
        if (dayTasks.length === 0) {
            calendarTaskList.innerHTML = '<p class="empty-state">No tasks for this date.</p>';
        } else {
            dayTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                calendarTaskList.appendChild(taskElement);
            });
        }
    }
    
    function renderAnalytics() {
        // Task completion chart
        const completionCanvas = document.getElementById('completion-chart');
        const completionCtx = completionCanvas.getContext('2d');
        
        // Clear canvas
        completionCtx.clearRect(0, 0, completionCanvas.width, completionCanvas.height);
        
        // Calculate completion rates for the last 7 days
        const days = [];
        const completionRates = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const dayTasks = tasks.filter(task => {
                if (!task.dueDate) return false;
                const taskDate = new Date(task.dueDate);
                return taskDate >= date && taskDate < nextDate;
            });
            
            const completedCount = dayTasks.filter(task => task.completed).length;
            const totalCount = dayTasks.length;
            const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            
            days.push(date.toLocaleDateString(undefined, { weekday: 'short' }));
            completionRates.push(rate);
        }
        
        // Draw bar chart
        const barWidth = 40;
        const barSpacing = 20;
        const chartHeight = 150;
        const startX = 30;
        const startY = 170;
        
        // Draw axes
        completionCtx.beginPath();
        completionCtx.moveTo(startX, startY);
        completionCtx.lineTo(startX + (barWidth + barSpacing) * 7, startY);
        completionCtx.stroke();
        
        // Draw bars
        completionRates.forEach((rate, index) => {
            const barHeight = (rate / 100) * chartHeight;
            const x = startX + index * (barWidth + barSpacing) + barSpacing;
            const y = startY - barHeight;
            
            // Draw bar
            completionCtx.fillStyle = '#6366f1';
            completionCtx.fillRect(x, y, barWidth, barHeight);
            
            // Draw label
            completionCtx.fillStyle = '#111827';
            completionCtx.font = '12px Poppins';
            completionCtx.textAlign = 'center';
            completionCtx.fillText(days[index], x + barWidth / 2, startY + 15);
            
            // Draw value
            completionCtx.fillText(`${rate}%`, x + barWidth / 2, y - 5);
        });
        
        // Task distribution chart
        const distributionCanvas = document.getElementById('distribution-chart');
        const distributionCtx = distributionCanvas.getContext('2d');
        
        // Clear canvas
        distributionCtx.clearRect(0, 0, distributionCanvas.width, distributionCanvas.height);
        
        // Calculate task distribution by category
        const categories = ['personal', 'work', 'shopping', 'health', 'other'];
        const categoryCounts = categories.map(category => 
            tasks.filter(task => task.category === category).length
        );
        
        const total = categoryCounts.reduce((sum, count) => sum + count, 0);
        const centerX = distributionCanvas.width / 2;
        const centerY = distributionCanvas.height / 2;
        const radius = 70;
        
        // Draw pie chart
        let startAngle = 0;
        const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
        
        categoryCounts.forEach((count, index) => {
            if (count === 0) return;
            
            const sliceAngle = (count / total) * 2 * Math.PI;
            
            // Draw slice
            distributionCtx.beginPath();
            distributionCtx.moveTo(centerX, centerY);
            distributionCtx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            distributionCtx.closePath();
            distributionCtx.fillStyle = colors[index];
            distributionCtx.fill();
            
            // Draw label
            const labelAngle = startAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
            
            distributionCtx.fillStyle = '#111827';
            distributionCtx.font = '12px Poppins';
            distributionCtx.textAlign = 'center';
            distributionCtx.fillText(`${categories[index]}: ${count}`, labelX, labelY);
            
            startAngle += sliceAngle;
        });
        
        // Productivity trends chart
        const trendsCanvas = document.getElementById('trends-chart');
        const trendsCtx = trendsCanvas.getContext('2d');
        
        // Clear canvas
        trendsCtx.clearRect(0, 0, trendsCanvas.width, trendsCanvas.height);
        
        // Calculate tasks completed per day for the last 7 days
        const completedPerDay = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const dayTasks = tasks.filter(task => {
                if (!task.dateAdded) return false;
                const taskDate = new Date(task.dateAdded);
                return taskDate >= date && taskDate < nextDate && task.completed;
            });
            
            completedPerDay.push(dayTasks.length);
        }
        
        // Draw line chart
        const pointRadius = 4;
        const chartStartX = 30;
        const chartStartY = 170;
        const chartWidth = 340;
        // const chartHeight = 150;
        
        // Draw axes
        trendsCtx.beginPath();
        trendsCtx.moveTo(chartStartX, chartStartY);
        trendsCtx.lineTo(chartStartX + chartWidth, chartStartY);
        trendsCtx.stroke();
        
        // Find max value for scaling
        const maxValue = Math.max(...completedPerDay, 1);
        
        // Draw line
        trendsCtx.beginPath();
        trendsCtx.strokeStyle = '#6366f1';
        trendsCtx.lineWidth = 2;
        
        completedPerDay.forEach((count, index) => {
            const x = chartStartX + (index / (completedPerDay.length - 1)) * chartWidth;
            const y = chartStartY - (count / maxValue) * chartHeight;
            
            if (index === 0) {
                trendsCtx.moveTo(x, y);
            } else {
                trendsCtx.lineTo(x, y);
            }
        });
        
        trendsCtx.stroke();
        
        // Draw points and labels
        completedPerDay.forEach((count, index) => {
            const x = chartStartX + (index / (completedPerDay.length - 1)) * chartWidth;
            const y = chartStartY - (count / maxValue) * chartHeight;
            
            // Draw point
            trendsCtx.beginPath();
            trendsCtx.fillStyle = '#6366f1';
            trendsCtx.arc(x, y, pointRadius, 0, Math.PI * 2);
            trendsCtx.fill();
            
            // Draw label
            trendsCtx.fillStyle = '#111827';
            trendsCtx.font = '12px Poppins';
            trendsCtx.textAlign = 'center';
            trendsCtx.fillText(days[index], x, chartStartY + 15);
            
            // Draw value
            trendsCtx.fillText(count.toString(), x, y - 10);
        });
    }
    
    function exportTasks() {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `tasks_${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Export Successful', 'Your tasks have been exported successfully.');
    }
    
    function importTasks(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedTasks = JSON.parse(event.target.result);
                
                if (Array.isArray(importedTasks)) {
                    // Merge with existing tasks, avoiding duplicates
                    const existingIds = tasks.map(task => task.id);
                    const newTasks = importedTasks.filter(task => !existingIds.includes(task.id));
                    
                    tasks = [...tasks, ...newTasks];
                    saveTasks();
                    
                    // Refresh current view
                    if (currentView === 'dashboard') {
                        renderDashboard();
                    } else if (currentView === 'tasks') {
                        renderTasks();
                    } else if (currentView === 'calendar') {
                        renderCalendar();
                    }
                    
                    showNotification('Import Successful', `${newTasks.length} tasks have been imported.`);
                } else {
                    showNotification('Import Failed', 'Invalid file format.');
                }
            } catch (error) {
                showNotification('Import Failed', 'Error parsing file.');
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    }
    
    function requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    notificationsEnabled = true;
                    localStorage.setItem('notificationsEnabled', 'true');
                    showNotification('Notifications Enabled', 'You will now receive task reminders.');
                } else {
                    notificationsEnabled = false;
                    localStorage.setItem('notificationsEnabled', 'false');
                }
            });
        }
    }
    
    function checkTaskReminders() {
        if (!notificationsEnabled) return;
        
        const now = new Date();
        
        tasks.forEach(task => {
            if (task.completed || !task.dueDate || !task.reminder || task.reminder === 'none') return;
            
            const dueDate = new Date(task.dueDate);
            
            // Set time if available
            if (task.dueTime) {
                const [hours, minutes] = task.dueTime.split(':');
                dueDate.setHours(hours, minutes);
            } else {
                // If no time is set, use end of day
                dueDate.setHours(23, 59, 59, 999);
            }
            
            let reminderTime;
            
            switch (task.reminder) {
                case '15min':
                    reminderTime = new Date(dueDate.getTime() - 15 * 60000);
                    break;
                case '30min':
                    reminderTime = new Date(dueDate.getTime() - 30 * 60000);
                    break;
                case '1hour':
                    reminderTime = new Date(dueDate.getTime() - 60 * 60000);
                    break;
                case '1day':
                    reminderTime = new Date(dueDate.getTime() - 24 * 60 * 60000);
                    break;
                default:
                    return;
            }
            
            // Check if it's time to show the reminder (within 1 minute)
            if (now >= reminderTime && now < new Date(reminderTime.getTime() + 60000)) {
                showNotification('Task Reminder', `"${task.title}" is due ${task.reminder.replace('min', 'minutes')}.`);
                
                // Mark reminder as shown to avoid重复通知
                task.reminderShown = true;
                saveTasks();
            }
        });
    }
    
    function showNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: 'https://cdn-icons-png.flaticon.com/512/3472/3472680.png'
            });
        }
    }
    
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.querySelector('i').className = 'fas fa-sun';
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Ctrl/Cmd + N to add new task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            addTaskBtn.click();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
});