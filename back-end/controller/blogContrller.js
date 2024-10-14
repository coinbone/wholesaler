const Joi = require ('joi');
const fs = require('fs');
const Blog = require('../models/blog');
const { BACKEND_SERVER_PATH } = require('../config/index');
const BlogDTO = require('../dto/Blog');
const BlogDetailsDTO = require('../dto/blogdetails');
const { title } = require('process');
const comments = require('../models/comments');

const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;

const blogController = {
    async create(req, res, next) {
        // 1. Validate request body
        const createBlogSchema = Joi.object({
            title: Joi.string().required(),
            author: Joi.string().regex(mongodbIdPattern).required(),
            content: Joi.string().required(),
            photo: Joi.string().required()
        });

        const { title, author, content, photo } = req.body;


        const { error } = createBlogSchema.validate(req.body);
        if (error) {
            return next(error);
        }


        // 2. Handle photo storage
        const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''), 'base64');
        const imagePath = `${Date.now()}-${author}.png`;

        try {
            fs.writeFileSync(`storage/${imagePath}`, buffer);
        } catch (error) {
            return res.status(404).send({
                success: false,
                message:'error in handling photo '
            })
        }

        // 3. Add to database
        let newBlog;
        try {
            newBlog = new Blog({
                title,
                author,
                content,
                photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}`
            });
            await newBlog.save();
        } 
        catch (error) {
            return next(error);
        }

        // 4. Return response
        const blogDto = new BlogDTO(newBlog);
        return res.status(201).json({ blog: blogDto });
    },

    async getAll(req, res, next) {
        try {
            const blogs = await Blog.find({});
            const blogsDto = blogs.map(blog => new BlogDTO(blog));
            return res.status(200).json({ blogs: blogsDto });
        } catch (error) {
            return next(error);
        }
    },

    async getById(req, res, next) {
        // Implement getById method
      
            const { id } = req.params;
            if (!mongodbIdPattern.test(id)) {
                return res.status(400).send({ success: false, message: 'Invalid blog ID format' });
            }
            try {
                const blog = await Blog.findOne({_id: id}).populate('author');
                if (!blog) {
                    return res.status(404).send({ success: false, message: 'Blog not found' });
                }
                const blogDto = new BlogDetailsDTO(blog);
                return res.status(200).json({ blog: blogDto });
            } catch (error) {
                return next(error);
            }
        }, 
        
   

        async update(req, res, next) {
            const updateBlogSchema = Joi.object({
                title: Joi.string().required(),
                content: Joi.string().required(),
                author: Joi.string().regex(mongodbIdPattern).required(),
                blogId: Joi.string().regex(mongodbIdPattern).required(),
                photo: Joi.string().optional()
            });
        
            // Validate request body
            const { error } = updateBlogSchema.validate(req.body);
            if (error) {
                return res.status(400).send({ success: false, message: error.details[0].message });
            }
        
            const { title, content, author, blogId, photo } = req.body;
            let blog;
        
            try {
                // Find the blog by ID
                blog = await Blog.findOne({ _id: blogId });
                if (!blog) {
                    return res.status(404).send({ success: false, message: 'Blog not found' });
                }
            } catch (err) {
                return next(err);
            }
        
            // Handle photo updates
            if (photo) {
                // Delete previous photo if it exists
                if (blog.photoPath) {
                    const previousPhoto = blog.photoPath.split('/').at(-1);
                    try {
                        fs.unlinkSync(`storage/${previousPhoto}`);
                    } catch (err) {
                        return res.status(500).send({ success: false, message: 'Error deleting previous photo' });
                    }
                }
        
                // Save new photo
                const buffer = Buffer.from(photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ''), 'base64');
                const imagePath = `${Date.now()}-${author}.png`;
        
                try {
                    fs.writeFileSync(`storage/${imagePath}`, buffer);
                } catch (err) {
                    return res.status(500).send({ success: false, message: 'Error saving new photo' });
                }
        
                // Update blog with new photo path
                await Blog.updateOne(
                    { _id: blogId },
                    { title, content, photoPath: `${BACKEND_SERVER_PATH}/storage/${imagePath}` }
                );
            } else {
                // Update blog without photo
                await Blog.updateOne({ _id: blogId }, { title, content });
            }
        
            return res.status(200).json({ message: 'Blog updated successfully' });
        },
        

        async delete(req, res, next) {
            //validate id
            // delete blog
            // delete comment on this blog 

             const deleteBlogSchema = Joi.object({
                id: Joi.string().regex(mongodbIdPattern).required(),
                });
                const {error} = deleteBlogSchema.validate(req.params);
                const {id}= req.params;

                //delete blog
                //delete comment 
                try {
                    await Blog.deleteOne({_id: id });

                    await comments.deleteMany({blog: id });


                } catch (error) {
                    return next (error);

                    
                }
                return res.status(200).json ({message:'blog deleted'});
                
            


        },

           
         
};

module.exports = blogController;
