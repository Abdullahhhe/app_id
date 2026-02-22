const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");

function generateIdByType(type) {
    const length = type === "trial" ? 4 : type === "paid" ? 5 : 6;
    let id = "";
    for (let i = 0; i < length; i++) {
        id += Math.floor(Math.random() * 10);
    }
    return id;
}
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
      }
    });
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // هل الإيميل موجود مسبقًا؟
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "البريد مستخدم مسبقًا" });
        }

        // إنشاء رمز تأكيد
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashed = await bcrypt.hash(password, 10);
        // إنشاء المستخدم بدون idUser
        const user = await User.create({
            name,
            email,
            password:hashed,
            isVerified: false,
            verificationCode
        });

        // إرسال الإيميل
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: "تأكيد حسابك",
            text:` رمز التأكيد الخاص بك هو: ${ verificationCode }`
    });

res.json({ message: "تم إنشاء الحساب. تم إرسال رمز التأكيد إلى بريدك." });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
}
});
router.post("/verify", async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

        if (user.verificationCode !== code)
            return res.status(400).json({ message: "رمز التأكيد غير صحيح" });

        // إنشاء idUser بعد التأكيد
        const generatedId =crypto.randomInt(10000, 99999);

        user.idUser = generatedId;
        user.isVerified = true;
        user.verificationCode = null; // حذف الرمز
        await user.save();

        res.json({
            message: "تم تأكيد الحساب",
            idUser: generatedId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
// تسجيل مستخدم جديد
/*router.post("/reg", async (req, res) => {
    try {
        const { name, email, password, role, numDay, type } = req.body;

        // تحقق من الإيميل
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "الإيميل مستخدم مسبقًا" });

        // تشفير كلمة المرور
        const hashed = await bcrypt.hash(password, 10);

        // توليد idUser حسب النوع
        const idUser = generateIdByType(type || "mongo");

        // إنشاء المستخدم
        const user = new User({
            name,
            email,
            password: hashed,
            idUser: idUser,
            role: role || "user",
            numDay: numDay || 3,
            type: type || "mongo"
        });
        console.log("user:",user);
        await user.save();

        res.json({
            message: "تم إنشاء الحساب بنجاح",
            idUser: idUser
        });

    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});*/
// تسجيل الدخول
router.post("/login", async (req, res) => {
    try {
        const { idUser, type } = req.body;
        const expectedLength = type === "trial" ? 4 : type === "paid" ? 5 : 6;
        if (!idUser || idUser.length !== expectedLength) {
            return res.status(400).json({ message: `idUser يجب أن يكون بطول ${expectedLength} لأصحاب النوع ${type}` });
        }
        const user = await User.findOne({ idUser, type });


        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET
        );

        user.lastLogin = new Date();
        user.lastActivity = new Date();
        const now = new Date();
        let expiresAt = user.isExpiresAt;
        console.log("numDay:", user.numDay);
        // إذا لم يكن هناك صلاحية أو انتهت → أنشئ واحدة جديدة
        if (!expiresAt) {
            expiresAt = new Date(now.getTime() + user.numDay * 24 * 60 * 60 * 1000);
            user.isExpiresAt = expiresAt;
            console.log("New expiresAt set for user:", expiresAt);
        }
        if(new Date(expiresAt) < now){
            return res.status(403).json({ message: "انتهت صلاحية هذا الحساب" });
        }
        await user.save();
        console.log("User logged in:", user);
        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                totalTimeSpent: user.totalTimeSpent,
                lastLogin: user.lastLogin,
                idUser: user.idUser,
                numDay: user.numDay,
                isExpiresAt: user.isExpiresAt,
                lastActivity: user.lastActivity,
                task: user.task,
                points: user.points,
                prime:user.prime
            }
        });
        console.log("Login successful for user:", user);
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
router.post("/activate-new-id", async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

        if (!user.mustCompleteTask)
            return res.status(400).json({ message: "لا يوجد شرط للتفعيل" });

        user.idUser = user.idUserNext;
        user.idUserNext = null;
        user.mustCompleteTask = false;

        await user.save();

        res.json({ message: "تم تفعيل الرقم الجديد", idUser: user.idUser });

    } catch (err) {
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
module.exports = router;