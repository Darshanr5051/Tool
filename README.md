# Hardware Inventory Dashboard

A modern, full-stack hardware inventory management system built with React and Node.js. It allows organizations to track IT assets, manage hardware requests, and control user access with a premium, responsive user interface.

## Features

- **Asset Management**: Track laptops, accessories, and other hardware components.
- **Quick Import**: Paste directly from Excel to bulk-import items seamlessly.
- **Access Control**: Role-based access control (Admin & Operator roles).
- **Request System**: Operators can request new hardware assets, which admins can approve.
- **System Logs**: Comprehensive audit trail of system activities.
- **Responsive UI**: A sleek, 3D-inspired glassmorphism interface that works beautifully across devices.

## Tech Stack

- **Frontend**: React, React Router, Axios, CSS Modules/Vanilla CSS, Lucide/React Icons.
- **Backend**: Node.js, Express, JSON file-based local storage, JWT Authentication, bcrypt.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm or yarn

## Getting Started

### 1. Clone & Install Dependencies

From the root directory, install the dependencies for both the frontend and backend:

```bash
# Install root dependencies (concurrently)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

In the `backend` directory, create a `.env` file (if not present) and add:

```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key
```

### 3. Run the Development Server

You can run both the frontend and backend simultaneously from the root folder:

```bash
npm run dev
```

- The **Frontend** will start on `http://localhost:3000`
- The **Backend** will start on `http://localhost:5000`

### Default Credentials
If this is a fresh setup, you can log in using the default admin credentials located in the `backend/data/users.json` file.

## Deployment Notes

Because the backend relies on an Express server and reads/writes to local JSON files (`users.json`, `inventory.json`, etc.), it **cannot** be hosted on static platforms like Netlify. 

For deploying to the web:
1. Host the **Frontend** on [Netlify](https://www.netlify.com/) or Vercel.
2. Host the **Backend** on a platform that supports Node.js servers, such as [Render](https://render.com/), Railway, or Heroku.
   - *Note*: Ephemeral filesystems (like Render's free tier) will reset your local JSON files upon every restart. For production use, consider migrating the JSON storage logic to a database like MongoDB or PostgreSQL.