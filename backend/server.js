require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const { authenticate } = require("./Middleware/auth");
const updateLastActivity = require("./middleware/updateLastActivity");

const app = express();

app.use(cors());
app.use(express.json());

// اتصال قاعدة البيانات
mongoose
    .connect("mongodb://localhost:27017/app_id")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Error:", err));

// مسارات مفتوحة (تسجيل الدخول + التسجيل)

app.use("/auth", authRoutes);

// مسار ping لتحديث آخر نشاط عند مغادرة الموقع
app.get("/api/ping", authenticate, updateLastActivity, (req, res) => {
    res.json({ ok: true });
});

// مسارات الأدمن + محمية + تحديث وقت
app.use("/api/admin", authenticate, updateLastActivity, adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${ PORT }`);
});