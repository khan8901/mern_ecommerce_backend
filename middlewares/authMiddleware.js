const jwt = require("jsonwebtoken");
const User = require("../models/user");


require('dotenv').config()
const JWT_SECRET = process.env.JWT_SECRET;



 exports.isAuthenticatedUser = async (req, res, next) => {
  try {

    const secret = JWT_SECRET; 

    // Check if authorization header is present
    const authHeader = req.headers.authorization;
    if (!authHeader) {

      return res.status(401).json({ message: "Authorization header missing" });
    }
    // Extract token from authorization header
    const token = authHeader.split(" ")[1];

    console.log(secret," this is secret");
    // Verify token and extract user id
     const  decoded = jwt.verify(token, secret);
     
    const userId = decoded.userId;
   // Fetch user from database and attach to request object
   const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    } 
req.user = user;    


    next() 

     
  } catch (error) {
    res.status(500).json({ message: "Error authenticating user" });
  }
};

 exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      res.status(401).json({ message: 'Not authorized as an admin' });
    }
  };
  
