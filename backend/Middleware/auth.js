const jwt = require("jsonwebtoken");

exports.authenticate = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "توكن غير موجود" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (err) {
        console.error("JWT Error:", err.message);
        return res.status(403).json({ message: "توكن غير صالح" });
    }
};