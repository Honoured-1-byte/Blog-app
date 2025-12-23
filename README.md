# 🌌 The Akashic Records

> A full-stack social blogging platform for documenting the anomalies of the digital universe.
> **[Live Demo](https://akashic-records-er1h.onrender.com)**

![Project Banner](https://res.cloudinary.com/dnyg7ue5v/image/upload/v1766522145/Gemini_Generated_Image_ykb6nnykb6nnykb6_oekwel.png)

## 🚀 Overview
The Akashic Records is a modern content management system (CMS) built to handle rich-media blogging with social interactions. Unlike static blogs, it features a dynamic "Trending" algorithm, user profiles with follower systems, and a fully "Cloud Native" architecture.

## ✨ Key Features
- **Authentication:** Secure Signup/Signin using SHA-256 Hashing & JWT/Sessions.
- **Social Graph:** Follow authors, Like posts, and Save/Bookmark articles for later.
- **Dynamic Homepage:** - **Talk of the Town:** Algorithmically sorts posts by engagement (Views + Likes).
  - **Deeper Dives:** Sorts long-form content by reading time.
- **Cloud Integration:** - **MongoDB Atlas:** For scalable database storage.
  - **Cloudinary:** For optimizing and serving user-uploaded assets.
- **Search Engine:** Real-time database searching for content discovery.
- **UI/UX:** Dark/Light theme toggle, 3D Tilt effects, and Glassmorphism design.

## 🛠️ Tech Stack
- **Frontend:** EJS (Server Side Rendering), Bootstrap 5, Vanilla JS.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB Atlas (Mongoose ODM).
- **Services:** Cloudinary API, Multer.
- **Deployment:** Render (Web Service).

## 📸 Screenshots
| Profile Dashboard | Dark Mode Reading |
| ----------------- | ----------------- |
| ![Profile](https://res.cloudinary.com/dnyg7ue5v/image/upload/v1766522255/Screenshot_2025-12-24_020404_pca11y.png) | ![Blog](https://res.cloudinary.com/dnyg7ue5v/image/upload/v1766522254/Screenshot_2025-12-24_020529_q2tquo.png) |

## 🔧 Installation
1. Clone the repo:
   ```bash
   git clone https://github.com/Honoured-1-byte/Blog-app.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up `.env` file:
   ```env
   MONGO_URL=your_mongodb_url
   CLOUDINARY_CLOUD_NAME=your_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   ```
4. Run the server:
   ```bash
   npm start
   ```

## 👤 Author
**Yash Seth**
- [LinkedIn](https://www.linkedin.com/in/yash-seth-9b0536351/)
- [GitHub](https://github.com/Honoured-1-byte)
