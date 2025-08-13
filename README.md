# 🖌️ Stateless 2D Editor

A web-based collaborative canvas built with **React** and **Fabric.js**, using **Firebase Firestore** for real-time save/load.  
The canvas supports creating and editing shapes, freehand drawing, text, object manipulation, export, and sharing via unique links.

---

## 📌 Features Implemented

- **Drawing & Editing Tools**
  - Rectangle, Circle, Text, and Freehand Pen
  - Move, Resize, Rotate, Delete
  - Change Fill Color
  - Edit Text Content

- **Advanced Editing**
  - Snap-to-Grid (20px)
  - Undo / Redo
  - Lock / Unlock Objects
  - Export as **PNG** or **SVG**

- **Collaboration & Persistence**
  - Auto-Save to Firestore (Debounced for efficiency)
  - Shareable Canvas URL via **sceneId**
  - Load existing scenes from link
  - Optional **View-Only Mode** via `?viewOnly=true`

- **Responsive UI**
  - Canvas width matches toolbar width
  - Fully resizes on window change

---

## 🧠 Architecture & Trade-offs

- **Fabric.js** chosen for rapid development and built-in object management, trading off lower-level canvas control.
- **Firestore without Auth** to enable quick sharing by link; relies on security rules scoped to `scenes` collection.
- **Debounced Firestore Writes** to minimize read/write costs — introduces a slight save delay (~800ms).
- **Client-Side Undo/Redo** via JSON snapshot stack — simpler but more memory-intensive than diff-based.
- **Snap-to-Grid** handled via `object:moving` event — fast, but limits sub-grid positioning.

---

## 📂 Project Structure

```
src/
  components/
    CanvasEditor.jsx
    Toolbar.jsx
    ShareButton.jsx
  hooks/
    useCanvasState.js
  firebase.js
  App.jsx
  main.jsx
styles.css
```

---

## ⚙️ Setup Instructions

### 1. Firebase Setup
- Create a Firebase project
- Enable **Cloud Firestore** (Native Mode)
- Enable **Cloud Firestore API** in Google Cloud Console

#### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scenes/{id} {
      allow read, write: if true; // Anyone with link
    }
    match /{document=**} {
      allow read, write: if false; // Deny all else
    }
  }
}
```

---

### 2. Environment Variables

Create a `.env` (or `.env.local` for Vite):

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

### 3. Install & Run Locally

```bash
npm install
npm run dev
```
Then open: **http://localhost:5173**

---

## 🚀 Deployment

### **Vercel**
```bash
npm run build
vercel
```
Framework: **Vite**  
Output dir: `dist`

### **Netlify**
- Build command: `npm run build`
- Publish directory: `dist`

### **Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

## 🔗 Live Demo
**Demo URL:** https://stateless-2-d-editor-godwinmano909-gmailcoms-projects.vercel.app/

---

## 🎥 Video Walkthrough

The video should demonstrate:
1. Opening `/` → Redirect to `/canvas/:sceneId`
2. Drawing shapes & text
3. Moving & resizing with **Snap-to-Grid**
4. Freehand drawing
5. Undo / Redo
6. Lock / Unlock object
7. Export PNG / SVG
8. Share via URL → Open in new tab to show same scene
9. (Optional) View-only mode

---

## 🏆 Bonus Features Implemented
- Snap-to-Grid (20px)
- Undo / Redo
- Lock / Unlock
- Export PNG / SVG
- View-only mode

---

## 🔮 Future Improvements
- Real-time multi-user cursors
- Keyboard shortcuts (Del, Ctrl+Z/Ctrl+Y)
- Object layering (Bring forward/backward)
- Toast notifications for actions



