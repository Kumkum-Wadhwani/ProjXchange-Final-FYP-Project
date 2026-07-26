import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    console.log('🔐 Auth middleware checking token...');
    
    const authHeader = req.headers.authorization || req.headers.Authorization;
   
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('❌ No token provided or invalid format');
      return res.status(401).json({ 
        success: false,
        message: "No token provided" 
      });
    }

    const token = authHeader.split(" ")[1];
    console.log('🔑 Token received:', token.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
   
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name
    };
    
    console.log('✅ User authenticated:', req.user);
   
    next();
  } catch (err) {
    console.error("❌ Token verification error:", err.message);
    return res.status(401).json({ 
      success: false,
      message: "Authentication failed",
      error: err.message 
    });
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    console.log('🔒 Checking authorization for roles:', allowedRoles);
    console.log('👤 Current user role:', req.user?.role);
    
    if (!req.user) {
      console.log('❌ No user in request');
      return res.status(401).json({ 
        success: false,
        message: "Not authenticated" 
      });
    }

    const userRole = req.user.role.toLowerCase();
    const allowed = allowedRoles.map(r => r.toLowerCase());
   
    if (!allowed.includes(userRole)) {
      console.log(`❌ Access denied. User role: ${userRole}, Allowed: ${allowed}`);
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Insufficient permissions." 
      });
    }

    console.log('✅ Authorization successful');
    next();
  };
};

