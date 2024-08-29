const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
const path = require('path');
// const multer = require('multer');
const upload = require("./config/multerconfig");

const port = 3001;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, './public/images/uploads')
//     },
//     filename: function (req, file, cb) {
//       crypto.randomBytes(12, (err, bytes) => {
//         const fn = bytes.toString("hex") + path.extname(file.originalname);
//         cb(null, fn)
//       });
//     }
//   });
  
//   const upload = multer({ storage: storage })

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

const isLoggedIn = (req, res, next) => {
    if(req.cookies.token === "") res.redirect('/login');

    else {
        let data = jwt.verify(req.cookies.token, "shhhh");
        req.user = data;
        
        return next();
    }
}

app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email}).populate("posts");
    res.render('profile', {user});
})

app.post('/register', async (req, res) => {
    let {email, username, name, password, age} = req.body;
    let user = await userModel.findOne({email});

    if(user) return res.status(500).send("User already register");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
           let user = await userModel.create({
                username,
                email,
                age,
                name,
                password: hash,
            });
            let token = jwt.sign({email: email, userid: user._id}, "shhhh");
            res.cookie("token", token);
            // res.send("registered");
            res.redirect('/login');
        });
    });
});

app.post('/login', async (req, res) => {
    let {email, password} = req.body;
    let user = await userModel.findOne({email});

    try {
        // if(!user) return res.status(500).send("Something Went wrong!");

        bcrypt.compare(password, user.password, (err, result) => {
            console.log(password)
            console.log(user.password)
            if(err) return res.status(500).send(err);
            if(result) {
                let token = jwt.sign({email: email, userId: user._id}, "shhhh");
                res.cookie("token", token);
                res.status(200).redirect('/profile');
            } 
            else res.redirect('/login');
        });
    }
    catch(err) {
        console.log(err);
    }
});

// app.post("/login", async (req, res) => {
//     // console.log(req.body);
  
//     const { email, password } = req.body;
  
//     if (!email || !password) {
//       res.status(422).json({ error: "fill all the details" });
//     }
  
//     try {
//       const userValid = await userModel.findOne({ email: email });
  
//       if (userValid) {
//         const isMatch = await bcrypt.compare(password, userValid.password);
  
//         // if (!isMatch) {
//         //   return res.status(401).json({ error: "Invalid email or password" });
//         // }
  
//         if (!isMatch) {
//           res.status(422).json({ error: "invalid details" });
//         } else {
//           // token generate
//           const token = await userValid.generateAuthtoken();
        
//         // let token = jwt.sign({email: email, userId: user._id}, "shhhh");
  
//           // cookiegenerate
//           res.cookie("token", token, {
//             expires: new Date(Date.now() + 9000000),
//             httpOnly: true,
//           });
  
//           const result = {
//             userValid,
//             token,
//           };
//           res.redirect('/profile');
//         }        
//       }
//       else {
//         res.status(201).json({ status: 201, result });
//     }
//     } catch (error) {
//       res.status(401).json(error);
//       console.log("catch block");
//     }
//   });

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect('/login');
});

app.post("/post", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});

    let {content} = req.body;

    let post = await postModel.create({
        user: user._id,
        content,
        likes: [],
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
});

app.get("/like/:id", isLoggedIn, async(req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    
    if (!post) {
        return res.status(404).json({ message: 'Post not found' });
    }

    if(post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid);
    } else {
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }

    await post.save();
    res.redirect('/profile');
});

app.get("/edit/:id", isLoggedIn, async(req, res) => {   
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    res.render('edit', {post});
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
    let {content} = req.body;
    let post = await postModel.findByIdAndUpdate(req.params.id, {content});
    res.redirect('/profile');
});

// app.get("/test", (req,  res) => {
//     res.render("test");
// });

// app.post("/upload", upload.single("image"), (req, res) => {
//     console.log(req.file);
// });

// app.get("/profile/upload", (req, res) => {
//     res.render('profileUpload');
// });

// app.post("/upload", isLoggedIn, upload.single("image"), async (req, res) => {
//     console.log(req.file);
//     let user = await userModel.findOne({email: req.user.email});
//     user.profilepic = req.file.filename;
//     await user.save();
//     res.redirect('/profile');
// });

// app.post("/delete/:id", async (req, res) => {
//     try {
//         console.log(req.params.id);
//         await postModel.findByIdAndDelete(req.params.id);
//         console.log("Post Deleted");
//         res.redirect("/profile"); 
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('An error occurred while deleting the post.');
//     }
// });

// app.get("/delete", async (req, res) => {
//     res.redirect('/profile');
// });


// app.post("/delete", async (req, res) => {
//     console.log("hii")
//     try {
//         await postModel.findByIdAndDelete(req.params.id);
//         console.log("Post Deleted");
//         res.redirect("/profile"); 
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('An error occurred while deleting the post.');
//     }
// });

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});