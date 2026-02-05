// ✅ Step 1: Firebase Configuration (Keep your existing config)
const firebaseConfig = {
  apiKey: "AIzaSyCmpZBES8rnq33UC7jsHLdBqE5GrEe6kp0",
  authDomain: "minidrive-ee651.firebaseapp.com",
  projectId: "minidrive-ee651",
  storageBucket: "minidrive-ee651.appspot.com",
  messagingSenderId: "361760622556",
  appId: "1:361760622556:web:e270f2a9101ce5d0e3b119"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const storage = firebase.storage();
let allFiles = []; // Store files locally for searching/filtering

// ✅ Step 2: Toast Notification System (Pro Feature)
function showToast(message, type = 'info') {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "fa-info-circle";
  if (type === 'success') icon = "fa-check-circle";
  if (type === 'error') icon = "fa-exclamation-circle";

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ✅ Step 3: UI Interaction Logic
const dropZone = document.getElementById("dropZone");

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  document.getElementById("fileInput").files = files;
  handleFileSelect({ files: files });
});

function handleFileSelect(input) {
  const btn = document.getElementById("uploadBtn");
  const statusDiv = document.getElementById("upload-status");
  const nameDisplay = document.getElementById("fileNameDisplay");

  if (input.files.length > 0) {
    statusDiv.style.display = "flex";
    nameDisplay.innerText = input.files[0].name;
    btn.disabled = false;
    btn.innerText = "Upload Now";
  }
}

// ✅ Step 4: Auth Logic
function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => showToast("Account Created! Welcome aboard.", "success"))
    .catch(err => showToast(err.message, "error"));
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      document.getElementById("auth-section").style.display = "none";
      document.getElementById("upload-section").style.display = "flex";
      showToast("Welcome back, Abhay!", "success");
      showFiles();
    })
    .catch(err => showToast(err.message, "error"));
}

function logout() {
  auth.signOut().then(() => {
    document.getElementById("upload-section").style.display = "none";
    document.getElementById("auth-section").style.display = "flex";
    showToast("Logged out successfully.");
  });
}

// ✅ Step 5: Upload Logic
function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return showToast("Please select a file first", "error");

  const uploadBtn = document.getElementById("uploadBtn");
  uploadBtn.innerText = "Uploading...";
  uploadBtn.disabled = true;

  const storageRef = storage.ref("files/" + file.name);
  storageRef.put(file).then(() => {
    showToast("File uploaded successfully!", "success");
    uploadBtn.innerText = "Upload";
    uploadBtn.disabled = false;
    document.getElementById("fileInput").value = "";
    document.getElementById("upload-status").style.display = "none";
    showFiles();
  }).catch(err => {
    showToast(err.message, "error");
    uploadBtn.innerText = "Retry";
    uploadBtn.disabled = false;
  });
}

// ✅ Step 6: Advanced Display & Filter Logic
function showFiles() {
  const listRef = storage.ref("files/");
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = '<p style="color:#aaa;">Syncing files...</p>';

  listRef.listAll().then(result => {
    allFiles = []; // Reset local cache
    const promises = result.items.map(item => {
      return item.getDownloadURL().then(url => {
        return {
          name: item.name,
          path: item.fullPath,
          url: url,
          type: getFileType(item.name)
        };
      });
    });

    Promise.all(promises).then(files => {
      allFiles = files;
      renderFiles(allFiles);
    });

  }).catch(err => showToast("Error loading files", "error"));
}

function getFileType(name) {
  if (name.match(/\.(jpg|jpeg|png|gif)$/i)) return 'image';
  if (name.match(/\.(mp4|avi|mov)$/i)) return 'video';
  if (name.match(/\.(pdf|doc|docx|txt)$/i)) return 'doc';
  return 'other';
}

function renderFiles(files) {
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "";

  if (files.length === 0) {
    fileList.innerHTML = '<p style="color:#aaa; text-align:center; grid-column: span 3;">No files found.</p>';
    return;
  }

  files.forEach(file => {
    let iconClass = "fa-file";
    if (file.type === 'image') iconClass = "fa-file-image";
    else if (file.type === 'video') iconClass = "fa-file-video";
    else if (file.type === 'doc') iconClass = "fa-file-lines";
    else if (file.name.endsWith(".js") || file.name.endsWith(".html")) iconClass = "fa-file-code";

    fileList.innerHTML += `
        <div class="file-card">
            <i class="file-icon fa-solid ${iconClass}"></i>
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div class="file-actions">
                <a href="${file.url}" target="_blank" class="btn-action btn-dl"><i class="fa-solid fa-download"></i></a>
                <button onclick="deleteFile('${file.path}')" class="btn-action btn-del"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
        `;
  });
}

// ✅ Filter Functions
function searchFiles() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const filtered = allFiles.filter(f => f.name.toLowerCase().includes(query));
  renderFiles(filtered);
}

function filterFiles(type) {
  // Update active nav link
  document.querySelectorAll('.sidebar nav a').forEach(el => el.classList.remove('active'));
  event.currentTarget.classList.add('active');

  if (type === 'all') {
    renderFiles(allFiles);
  } else {
    const filtered = allFiles.filter(f => f.type === type);
    renderFiles(filtered);
  }
}

// ✅ Step 7: Delete File
function deleteFile(path) {
  if (!confirm("Are you sure you want to delete this file?")) return;

  const fileRef = storage.ref(path);
  fileRef.delete().then(() => {
    showToast("File deleted.", "info");
    showFiles();
  }).catch(err => showToast(err.message, "error"));
}
