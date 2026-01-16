const { Schema, model } = require('mongoose');

const blogSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    coverImageURL: {
        type: String,
        required: false,
        default: 'https://res.cloudinary.com/dnyg7ue5v/image/upload/v1765452965/defaultBlog_uplqdu.png',
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
        }
    ],
    likes: [
        {
            type: Schema.Types.ObjectId,
            ref: "user",
        },
    ],
    views: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true
});

const Blog = model('Blog', blogSchema);

module.exports = Blog;