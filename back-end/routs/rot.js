const express= require('express');
const router = express.Router();
const authcontroller = require('../controller/authcontroller');
const auth =require('../middlewares/auth');
const blogController= require ('../controller/blogContrller');
const commentController = require ('../controller/commentController')

//user
//register
router.post('/register', authcontroller.register);
//login
router.post('/login', authcontroller.login);

//logout
router.post('/logout',auth, authcontroller.logout);
//refresh
router.get('/refresh',authcontroller.refresh);


// blogs
//create
router.post('/blog',auth,blogController.create);
//get all 
router.get('/blog/all',auth, blogController.getAll);
//get blog by id
router.get('/blog/:id',auth, blogController.getById);
//update
router.put('/blog',auth, blogController.update);    
//delete
router.delete('/blog/:id',auth,blogController.delete);

// comments 
// create  
router.post('/comment',auth,commentController.create);

// get
router.get ('/comment/:id',auth,commentController.getById);



module.exports= router;
