const router = require("express").Router();
const User = require("../models/Users");

// جلب كل المستخدمين مع الوقت المقضي
router.get("/users", async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "ممنوع" });
        }
        const users = await User.find().select("-password");
        res.json(users);
    }
    catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
router.post("/user/:id/task", async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "ممنوع" });
        }
        const { task } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }
        user.task.push({ task, createdAt: new Date(), done: false ,proofImage:null,status:"معلق"});
        await user.save();
        res.json({ message: "تم إضافة المهمة" });
    } catch (err) {
        console.error("Error adding task:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
router.get("/user/:id/task", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }
        res.json({ task: user.task ,done: user.task.done});
    } catch (err) {
        console.error("Error fetching tasks:", err);
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
router.delete("/user/:id", async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "ممنوع" });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }
        res.json({ message: "تم حذف المستخدم" });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
router.delete("/user/:id/task/:index", async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "ممنوع" });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }
        const taskIndex = parseInt(req.params.index);
        if (isNaN(taskIndex) || taskIndex < 0 || taskIndex >= user.task.length) {
            return res.status(400).json({ message: "مؤشر المهمة غير صالح" });
        }
        user.task.splice(taskIndex, 1);
        await user.save();
        res.json({ message: "تم حذف المهمة" });
    } catch (err) {
        console.error("Error deleting task:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
/*router.put("/user/:id/task/:index", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }
        const taskIndex = parseInt(req.params.index);
        if (isNaN(taskIndex) || taskIndex < 0 || taskIndex >= user.task.length) {
            return res.status(400).json({ message: "مؤشر المهمة غير صالح" });
        }
        user.task[taskIndex].done = true;
        user.markModified("task");
        await user.save();
        res.json({ message: "تم تحديث المهمة" });
        console.log(`Task at index ${ taskIndex } for user ${ user._id } marked as done.`);
    } catch (err) {
        console.error("Error marking task as done:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});*/
const upload = require("../upload");
router.post("/user/task/:id/:taskIndex/upload", upload.single("image"),async (req, res) => {
    try {
        const {id,taskIndex} = req.params;
        console.log(`Received file upload for user ${id}, task index ${taskIndex}`);
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "المستخدم غير موجود" });
        }
        user.task[taskIndex].proofImage = req.file.filename;
        console.log(`Saved file ${req.file.filename} for user ${id}, task index ${taskIndex}`);
        user.task[taskIndex].status = "معلق";
        user.markModified("task");
        await user.save();
        res.json({ message: "تم رفع الصورة بنجاح" });
    } catch (err) {
        console.error("Error uploading task image:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
const complotedTask=require("../models/CompletedTask");
const CompletedTask = require("../models/CompletedTask");
router.put("/task/:id/:taskIndex/approve", async (req, res) => {
    const {id,taskIndex} = req.params;
    const user= await User.findById(id);
    if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
    }
    const taskee=user.task[taskIndex];
    if (!taskee) {
        return res.status(404).json({ message: "المهمة غير موجودة" });
    }
    user.task[taskIndex].done = true;
    user.task[taskIndex].status="تم الأنجاز"
    await User.findByIdAndUpdate(id, {
                $inc: { points: 3 }
            });
    user.markModified("task");
    await user.save();
    await complotedTask.create({
        userId: user._id,
        userName: user.name,
        task: taskee.task,
        proofImage: taskee.proofImage,
        status: "مقبول"
    });

    res.json({ message: "تم اعتماد المهمة" });
});
router.get("/completed-tasks", async (req, res) => {
    try {
        const tasks = await complotedTask.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        console.error("Error fetching completed tasks:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
router.put("/task/:id/:taskIndex/reject", async (req, res) => {
    const {id,taskIndex} = req.params;
    const user= await User.findById(id);
    if (!user) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
    }
    user.task[taskIndex].status = "غير مقبول";
    user.markModified("task");
    await user.save();
    res.json({ message: "تم رفض المهمة" });
});
router.put("/user/:id/updateDays", async (req, res) => {
    const { id } = req.params;
    const { numDay } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.numDay = numDay;

    // إعادة حساب وقت انتهاء جديد
    const newExpiresAt = new Date(Date.now() + numDay * 24 * 60 * 60 * 1000);
    user.isExpiresAt = newExpiresAt;

    await user.save();

    res.json({
        message: "تم تحديث الأيام وتمديد صلاحية الحساب",
        expiresAt: newExpiresAt
    });
});
router.get("/completed-tasks/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const tasks = await CompletedTask.find({ userId })
            .sort({ completedAt: -1 }); // ترتيب من الأحدث إلى الأقدم

        res.json(tasks);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
const nodemailer = require("nodemailer");
const crypto = require("crypto");

router.post("/add-user", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // إنشاء رمز تأكيد عشوائي
    const verificationCode = crypto.randomInt(100000, 999999).toString();

    // إنشاء المستخدم بدون idUser
    const user = await User.create({
      name,
      email,
      password,
      verificationCode,
      isVerified: false
    });

    // إعداد الإيميل
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
      }
    });

    // إرسال الإيميل
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "تأكيد حسابك",
      text:` رمز التأكيد الخاص بك هو: ${verificationCode}`
    });

    res.json({ message: "تم إرسال رمز التأكيد إلى البريد" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
});

module.exports = router;