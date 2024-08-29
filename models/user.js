const mongoose = require('mongoose');
// mongoose.connect(`mongodb://localhost:27017/miniproject2`);

const DB = `mongodb+srv://suhasikakani545:suhasi545@cluster0.sbjpw9n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
mongoose.connect(DB)
.then(() => console.log("Database connected"))
.catch((err) => console.log(err));


const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    profilepic: {
        type: String,
        default: "profile.png"
    },
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId, ref: "post"
        }
    ],
});

module.exports = mongoose.model('user', userSchema);