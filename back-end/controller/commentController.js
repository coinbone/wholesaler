
const Joi = require('joi');
const Comments = require('../models/comments');
const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;
const CommentDTO = require('../dto/comment')


const commentController ={
    async create(req,res,next){
        const createcommentSchema = Joi.object({
            content: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            blog: Joi.string().regex(mongodbIdPattern).required()
        })
        const {error} = createcommentSchema.validate(req.body);
         if (error){
            return next(error);
            
         }

         const{content, author ,blog} = req.body;
         try {
            const newComment = new comments({
                content, author , blog  
            });
            await newComment.save();
            
         } catch (error) {
            return next(error);
         }

         return res.status(200).json({message:'comment created'})
    },
async getById(req , res ,next ){
    const getByIdSchema = Joi.object({
        id :Joi.string().regex(mongodbIdPattern).required()
    });
    const {error}= getByIdSchema.validate(req.params);
    if(error){
        return next (error);
    }
    const {id} =req.params;

    let comment
    try {
        comment = await Comments.find({blog: id}).populate('author');
    } 
    catch (error) {
        return next (error);

    } 
    let commentsDto = [];
    for(let i = 0; i<Comments.length;i++){
        const obj =new CommentDTO(comment[i]);
        commentsDto.push(obj);
    }
    
    

     return res.status(200).json({data: commentsDto})

   }
}
module.exports = commentController; 