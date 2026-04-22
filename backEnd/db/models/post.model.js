import { model, Schema } from 'mongoose';

const postSchema = new Schema({
    title: String,
    content: String,
});

const Post = model('Post', postSchema);

export default Post;