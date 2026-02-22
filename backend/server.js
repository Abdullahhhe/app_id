require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const { authenticate } = require("./Middleware/auth");
const updateLastActivity = require("./middleware/updateLastActivity");
//لحفظ بيانات الجلسة
const session = require("express-session");
const app = express();

app.use(cors({
    origin:"http://localhost:3000",
    credentials:true
}));
app.use(express.json());
app.use(session({
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        httpOnly:true,
        sameSite:"lax"
    } // true إذا كنت تستخدم HTTPS
}));


// اتصال قاعدة البيانات
mongoose
    .connect("mongodb://localhost:27017/app_id")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Error:", err));

// مسارات مفتوحة (تسجيل الدخول + التسجيل)

app.use("/auth", authRoutes);





const adRouter = require("./routes/ad");
app.use("/api/ads", adRouter);
// مسار ping لتحديث آخر نشاط عند مغادرة الموقع
app.get("/api/ping", authenticate, updateLastActivity, (req, res) => {
    res.json({ ok: true });
});

// مسارات الأدمن + محمية + تحديث وقت
app.use("/api/admin", authenticate, updateLastActivity, adminRoutes);
app.use("/uploads", express.static("uploads"));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});