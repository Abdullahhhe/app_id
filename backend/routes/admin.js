const router = require("express").Router();
const User = require("../models/Users");

// جلب كل المستخدمين مع الوقت المقضي
router.get("/users", async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "ممنوع" });
        }

        const users = await User.find().select("-password");

        res.json(
            users.map((u) => ({
                _id: u._id,
                name: u.name,
                email: u.email,
                role: u.role,
                totalTimeSpent: u.totalTimeSpent,
                lastLogin: u.lastLogin,
                lastActivity: u.lastActivity
            }))
        );
    } catch (err) {
        console.error("Admin users error:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
// جلب مستخدم واحد عبر ID
router.get("/user/:id", async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "ممنوع" });
        }

        const user = await User.findById(req.params.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }

        res.json(user);
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
module.exports = router;