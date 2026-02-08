const User = require("../models/Users");

module.exports = async function updateLastActivity(req, res, next) {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) return next();

        const now = new Date();

        if (user.lastActivity) {
            const diffSeconds = Math.floor((now - user.lastActivity) / 1000);
            if (diffSeconds > 0) {
                user.totalTimeSpent += diffSeconds;
            }
        }

        user.lastActivity = now;
        await user.save();

        next();
    } catch (err) {
        console.error("خطأ في تحديث الوقت:", err);
        next();
    }
};