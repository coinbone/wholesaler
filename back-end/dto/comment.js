class CommentDTO{
    constructor(comment){
        this.id = comment.id;
        this.createdAt = comment.createdAt;
        this.content = comment.content;
        this.authorUsername = comment.author.username;


    } 
}
module.exports= CommentDTO;