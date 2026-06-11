# 🌍 Visit AP — Geolocation-Enabled Full-Stack Tourism Platform

[![React Version](https://img.shields.io/badge/React-18.2-blue?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js Version](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Visit AP** is a production-grade, geolocation-powered tourism exploration platform designed to showcase the heritage, culture, and beauty of Andhra Pradesh. The application features a rich, responsive interface with interactive maps, smart routing, nearby attraction recommendations, dynamic travel collections, and a robust admin dashboard for platform management.

## 📸 Screenshots

### 🏠 Home Page (Hero & Live Tour)
![Visit AP Home Page](./images/screenshot_home.png)

### 🧭 Districts Page (Explore Districts Grid)
![Visit AP Explore Districts](./images/screenshot_districts.png)

### 🔐 Authentication Portal (Secure Login)
![Visit AP Login Portal](./images/screenshot_login.png)

---

## 🗺️ Platform Architecture & Features

### 📍 1. Geospatial & Geolocation Engine
* **Real-time Navigation**: Detects the user's current GPS location via the Web Geolocation API, calculates distance metrics to selected destinations using the Haversine formula, and redirects users to Google Maps for turn-by-turn navigation.
* **Nearby Place Recommendations**: Uses MongoDB `2dsphere` indexes to execute spatial queries, allowing travelers to instantly identify other landmarks within a custom 5 km, 10 km, or 20 km radius of their current location.
* **Interactive Leaflet Maps**: Offers interactive district and landmark maps with custom markers and clusters built on OpenStreetMap layers.

### 🧭 2. District & Category Explorations
* **26 Curated District Pages**: Complete coverage of all 26 restructured districts of Andhra Pradesh, loaded with unique high-resolution local photography and structured descriptions.
* **260 Curated Landmarks**: Comprehensive details for each location, including description, cover photos, multi-image galleries, and interactive maps.
* **Categorized Travel**: Categorization including *Temples*, *Beaches*, *Hill Stations*, *Historical Sites*, and *Nature & Wildlife*.

### 🔒 3. Secure Admin Portal
* **Role-based Authentication**: Secure administrator access managed via JSON Web Tokens (JWT) stored in HTTP-only state with password hashing via `bcryptjs`.
* **CRUD Management**: An interface allowing administrators to Add, Update, or Delete Districts and Place documents on the fly.
* **Cloudinary Asset Storage**: Automated picture uploads and image resizing powered by the Cloudinary API.

### 💬 4. Interactive Feedback System
* **Contextual Feedback Widget**: Floating responsive widget tailored for smooth desktop and mobile interactions (complying with mobile bottom safe-area insets).
* **Global Custom Trigger**: Operates using a lightweight browser event listener, enabling users to call the feedback modal from multiple navigation headers or footer links.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Modular UI structure, fast Hot Module Replacement (HMR) |
| **Styling** | Tailwind CSS + Framer Motion | Premium glassmorphism effects, responsive margins, micro-animations |
| **State Management** | React Context API | Context providers for User Authentication & Admin states |
| **Map Engine** | Leaflet + React Leaflet | Open-source map widgets, custom marker pins |
| **Backend** | Node.js + Express.js | Model-View-Controller (MVC) architecture |
| **Database** | MongoDB Atlas | Geospatial `2dsphere` indexing, multi-collection relationships |
| **File Storage** | Cloudinary | Auto-optimized image hosting |
| **E2E Testing / Auditing** | Custom Node.js scripts | Automatic coordinates ranges, precision warnings, and duplication filters |

---

## 📂 Project Structure

```
visitap/
├── backend/
│   ├── config/          # Database connection configurations
│   ├── controllers/     # Route controller handlers (Auth, Places, Districts, etc.)
│   ├── data/            # Static datasets, individual district JSONs, & backups
│   ├── middleware/      # JWT authorization & multer file upload handling
│   ├── models/          # Mongoose Schemas (District, Place, Admin, Feedback)
│   ├── reports/         # Output logs for geospatial & coordinate audits
│   ├── routes/          # API route definitions
│   ├── scripts/         # Database seeding, backup, and verification tools
│   ├── server.js        # Entry point for the Express API
│   └── package.json     # Node scripts & dependencies
├── frontend/
│   ├── public/          # Favicon and brand assets
│   ├── src/
│   │   ├── components/  # Reusable UI widgets (Navbar, Footer, Maps, Feedbacks)
│   │   ├── context/     # React Context state layers (AuthContext)
│   │   ├── pages/       # View templates (Home, Districts, Map, Admin portals)
│   │   ├── services/    # Axios HTTP service request wrappers
│   │   ├── App.jsx      # Router routing & global event management
│   │   └── main.jsx     # Frontend entry point
│   ├── package.json     # UI dependencies & build scripts
│   ├── tailwind.config.js # Global color palettes, HSL tokens, and typography
│   └── vite.config.js   # Vite configuration directives
└── README.md            # Project documentation
```

---

## 🚀 Getting Started & Installation

### Prerequisites
* Node.js (v18.x or higher recommended)
* npm (v9.x or higher)
* MongoDB database (local or Atlas cluster)
* Cloudinary account (for image upload support)

---

### 1️⃣ Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `backend/` directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
   ```
4. Seed the initial database (districts and 260 tourist places):
   ```bash
   npm run seed
   ```
5. Start the backend server:
   ```bash
   npm run dev
   ```

---

### 2️⃣ Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Build the application for production:
   ```bash
   npm run build
   ```

---

## 🧪 Database & Geospatial Audit Scripts

The backend includes a comprehensive suite of verification scripts designed to audit, repair, and validate dataset integrity:

* **Verify Coordinates** (`npm run verify-coordinates`):
  Runs an offline check on all 260 tourist place coordinates to validate:
  * Proper GeoJSON structure
  * Lat/Lng range bounds
  * AP geographical boundary bounds (Lat: `[12.6, 19.2]`, Lng: `[76.7, 84.8]`)
  * Low-precision warnings (< 4 decimal places)
  * Duplicate checks (allowed groups vs unexpected overlaps)
* **Verify Consistency** (`npm run verify-consistency`):
  Checks cross-consistencies between local master files, individual district JSONs, and the active MongoDB database collections.
* **Audit Images** (`npm run audit-images`):
  Scans all cover images and gallery images for broken links, duplicate files, and missing assets.
* **Verify Analytics** (`npm run verify-analytics`):
  Validates database statistics, view trackers, and user ratings.

---

## 👥 Authors & Credits

* **Developer & Architect**: [Prudhvi Raju Jubburu](https://www.linkedin.com/in/jubburu-prudhvi-raju/)
* Designed and developed for the **Andhra Pradesh Tourism Authority** to deliver a premium, modern experience for travelers.