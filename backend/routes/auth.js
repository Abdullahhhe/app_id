const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");

// تسجيل مستخدم جديد
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "الإيميل مستخدم مسبقًا" });
        
        const hashed = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashed,
            role: role || "user"
        });

        await user.save();

        res.json({ message: "تم إنشاء الحساب بنجاح" });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});

// تسجيل الدخول
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: "كلمة المرور خاطئة" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET
        );

        user.lastLogin = new Date();
        user.lastActivity = new Date();
        await user.save();

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                totalTimeSpent: user.totalTimeSpent,
                lastLogin: user.lastLogin,
                lastActivity: user.lastActivity
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});

module.exports = router;