import express from "express";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./db/connetions.js";
import Post from "./db/models/post.model.js";

const app = express();

app.use(express.json());

await connectDB();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const getPosts = async () => {
    const posts = await Post.find();
    return posts;
}

io.on("connection", (socket) => {
    console.log("user connected on this id", socket.id);


    socket.on("createPost", async (data) => {
        console.log("data from client to create post", data);
        const post = await Post.create(data);
        io.emit("postCreated", { message: "post created successfully", post });
    });

    socket.on("getPosts", async () => {
        const posts = await getPosts();
        socket.emit("posts", posts);
    });

    socket.on("deletePost", async (postId) => {
        console.log("post id to delete", postId);
        await Post.findByIdAndDelete(postId);
        io.emit("postDeleted", { message: "post deleted successfully", postId });
    });

    socket.on("updatePost", async (data) => {
        console.log("data from client to update post", data);
        const { postId, title, content } = data;
        await Post.findByIdAndUpdate(postId, { title, content });
        io.emit("postUpdated", { message: "post updated successfully", postId, title, content });
    });


    socket.on("searchPosts", async (searchTerm) => {
        console.log("search term from client", searchTerm);
        const posts = await Post.find({
            $or: [
                { title: { $regex: searchTerm, $options: "i" } },
                { content: { $regex: searchTerm, $options: "i" } }
            ]
        });
        socket.emit("searchResults", posts);
    });


    socket.on("disconnect", () => {
        console.log("user disconnected from this id", socket.id);

    });

})

server.listen(3000, () => {
    console.log("listening on :3000");

});