import jwt from 'jsonwebtoken';

// Sirf admin token wali requests allow karta hai (user token yahan kaam nahi karega)
const adminAuth = (req, res, next) => {
    const { token } = req.headers;
    if (!token) {
        return res.json({ success: false, message: 'Not Authorized' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.json({ success: false, message: 'Not Authorized' });
        }
        next();
    } catch (error) {
        return res.json({ success: false, message: 'Not Authorized' });
    }
}

export default adminAuth;
