const router = require("express").Router();
const Ad =require("../models/Ad");
const User=require("../models/Users");
const crypto = require("crypto");

/*async function verifyCaptcha(token) {
    const secret = "6Lcp1G8sAAAAACK2Qa2zxMPBuKfkDZLzPfvRu1Fn";

  const res = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: secret=`${secret}&response=${token}`
  });

  const data = await res.json();
  return data.success;
}*/

router.get("/random", async (req, res) => {
    //const {captchaToken}=req.body;
    /*const isHuman=await verifyCaptcha(captchaToken);
    if(!isHuman){
        return res.status(400).json({message:"فشل التحقق من Captcha"});
    }*/
    try {
        const ads = await Ad.find();

        if (!ads.length) {
            return res.status(404).json({ message: "لا توجد إعلانات" });
        }

        const randomAd = ads[Math.floor(Math.random() * ads.length)];

        const token = crypto.randomBytes(16).toString("hex");

        req.session.adToken = token;
        req.session.adId = randomAd._id;
        req.session.adStartTime=Date.now();

        res.json({
            ad: randomAd,
            token
        });

    } catch (err) {
        console.log("ERROR IN RANDOM:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
router.post("/complete", async (req, res) => {
    try {
        //const { token, id,captchaToken } = req.body;
        const { token, id } = req.body;
        /*const isHuman = await verifyCaptcha(captchaToken);
        if (!isHuman) {
            return res.status(400).json({ message: "فشل التحقق من Captcha" });
        }*/
        if (token !== req.session.adToken) {
            return res.status(400).json({ message: "محاولة غش" });
        }

        const MIN_WATCH_TIME = 30000; // 30 ثانية
        const watchTime = Date.now() - req.session.adStartTime;

        if (watchTime < MIN_WATCH_TIME) {
            return res.status(400).json({ message: "لم تكمل مشاهدة الإعلان" });
        }

        const ad = await Ad.findById(req.session.adId);

        if (!ad) {
            return res.status(400).json({ message: "الإعلان غير موجود" });
        }

        await User.findByIdAndUpdate(id, {
            $inc: { points: ad.reward }
        });
        req.session.adToken = null;
        req.session.adId = null;
        req.session.adStartTime = null;

        res.json({ message: "تم إضافة النقاط", reward: ad.reward });

    } catch (err) {
        console.log("ERROR IN COMPLETE:", err);
        res.status(500).json({ message: "خطأ في السيرفر" });
    }
});
module.exports = router;