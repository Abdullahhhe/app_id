const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },

    role: { type: String, default: "user" },

    // عدد الأيام التي تبقى قبل انتهاء الصلاحية
    numDay: { type: Number, default: 3 },

    lastLogin: Date,
    lastActivity: Date,

    // الرقم الحالي المستخدم للدخول
    idUser: { type: String, unique: true },
    // الرقم الجديد الذي يتم توليده بعد انتهاء الوقت
    idUserNext: { type: String, default: null },

    // نوع المستخدم: يحدد عدد الخانات
    type: {
        type: String,
        enum: ["trial", "paid", "mongo"],
        default: "paid",
        required: true
    },

    // وقت انتهاء الصلاحية
    isExpiresAt: { type: Date, default: null },

    prime: { type: Boolean, default: false },
    // شرط التفعيل قبل استخدام idUserNext
    mustCompleteTask: { type: Boolean, default: false },
    verificationCode: { type: String },
    // المهمات
    task: { type: Array, default: [] },
    points: { type: Number, default: 0 },
    // الوقت الذي قضاه المستخدم داخل الموقع
    totalTimeSpent: { type: Number, default: 0 }
});

module.exports = mongoose.model("User", userSchema);