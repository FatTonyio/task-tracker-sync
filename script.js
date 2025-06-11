// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration (PASTE YOURS HERE)
const firebaseConfig = {
    apiKey: "AIzaSyA7S9CUeDtbElKEP5mxvLrSS19_0MoP90Y",
    authDomain: "mytasktrackersync.firebaseapp.com",
    projectId: "mytasktrackersync",
    storageBucket: "mytasktrackersync.firebasestorage.app",
    messagingSenderId: "619424720311",
    appId: "1:619424720311:web:fa26772c228cb6e472b432",
    measurementId: "G-M346Q6KMZ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Get a reference to the Firestore database

// Get references to DOM elements
const newTaskInput = document.getElementById('newTaskInput');
const addTaskButton = document.getElementById('addTaskButton');
const taskList = document.getElementById('taskList');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const pendingTasksSpan = document.getElementById('pendingTasks');

// --- Helper Functions ---
function updateDashboard(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    totalTasksSpan.textContent = total;
    completedTasksSpan.textContent = completed;
    pendingTasksSpan.textContent = pending;
}

function renderTasks(tasks) {
    taskList.innerHTML = ''; // Clear current list
    tasks.forEach(task => {
        const listItem = document.createElement('li');
        if (task.completed) {
            listItem.classList.add('completed');
        }

        listItem.innerHTML = `
            <span class="task-text">${task.text}</span>
            <div class="task-actions">
                <button class="complete-btn" data-id="${task.id}">
                    ${task.completed ? 'Undo' : 'Complete'}
                </button>
                <button class="delete-btn" data-id="${task.id}">Delete</button>
            </div>
        `;
        taskList.appendChild(listItem);
    });
    updateDashboard(tasks);
}

// --- Event Listeners ---

// Add Task Functionality
addTaskButton.addEventListener('click', async () => {
    const taskText = newTaskInput.value.trim();
    if (taskText !== '') {
        try {
            await addDoc(collection(db, "tasks"), {
                text: taskText,
                completed: false,
                timestamp: new Date() // Add a timestamp for ordering
            });
            newTaskInput.value = ''; // Clear input
        } catch (e) {
            console.error("Error adding document: ", e);
            alert("Error adding task. Check console for details.");
        }
    }
});

// Allow adding task with Enter key
newTaskInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addTaskButton.click();
    }
});

// Handle Complete and Delete Buttons using event delegation
taskList.addEventListener('click', async (event) => {
    const target = event.target;
    const taskId = target.dataset.id; // Get the Firestore document ID

    if (!taskId) return; // Not a button we care about

    if (target.classList.contains('complete-btn')) {
        const taskRef = doc(db, "tasks", taskId);
        // Find the task in the current local tasks array to get its current completed status
        const currentTask = currentTasks.find(t => t.id === taskId);
        if (currentTask) {
            await updateDoc(taskRef, {
                completed: !currentTask.completed // Toggle status
            });
        }
    } else if (target.classList.contains('delete-btn')) {
        const taskRef = doc(db, "tasks", taskId);
        await deleteDoc(taskRef);
    }
});

// --- Real-time Data Synchronization with Firestore ---
let currentTasks = []; // A local array to hold tasks as they come from Firestore

// Set up a real-time listener for the "tasks" collection
// The query orders tasks by their creation timestamp
const tasksQuery = query(collection(db, "tasks"), orderBy("timestamp", "asc"));

onSnapshot(tasksQuery, (snapshot) => {
    currentTasks = []; // Clear the local array for fresh data
    snapshot.forEach((doc) => {
        currentTasks.push({ id: doc.id, ...doc.data() });
    });
    renderTasks(currentTasks); // Re-render the UI with the latest data
}, (error) => {
    console.error("Error fetching tasks: ", error);
    alert("Error loading tasks. Check console for details.");
});