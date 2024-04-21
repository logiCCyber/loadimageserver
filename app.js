import express from "express";
import multer from "multer";
import fs from "fs";
import "dotenv/config";
import {resolve, join} from "path";
import { constants } from "buffer";
import session from "express-session";
import crypto from "crypto";


const app = express();
const __dirname = resolve();
app.use(express.static("static"));
app.use(express.urlencoded({extended: true}));
app.use(session({
    cookie: {
        maxAge: 36000
    },
    secret: crypto.randomBytes(16).toString("hex")
}));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    }, 
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const auth = {
    username: process.env.LOGIN,
    password: process.env.PASSWORD
}

const upload = multer({storage: storage});

app.post('/', (req, res) => {
    if(auth.username === req.body.username && auth.password === req.body.password) {
        req.session.user = true;
        res.status(200).sendFile(join(__dirname, "static", "room.html"));
    } else {
        res.status(400).send("Error: username or password is incorrect");
    }
});

app.post('/upload', upload.single("file"), (req, res) => {
    if(req.session && req.session.user) {
        if(!req.file) {
            res.status(400).send("File not chosen");
        } else {
            console.log("Success!");
            res.status(200).sendFile(join(__dirname, "static", "room.html"));
        }
    } else {
        res.redirect("/");
    }
});


app.get('/files', (req, res) => {
    if(req.session && req.session.user) {
        fs.readdir("uploads", "utf-8", (err, files) => {
            if(err) {
                console.log("Folder not found!");
                res.status(400).send("Folder not found!");
            }    
            res.status(200).json(files);
        });
    } else {
        res.redirect("/");
    }
});

app.get('/download/:filename', (req, res) => {
    if(req.session && req.session.user) {
        const file = join(__dirname, "uploads", req.params.filename);
        if(fs.existsSync(file)) {
            res.status(200).download(file);
        } else {
            res.status(400).send("Incorrect filename. Try again")
        }
    } else {
        res.redirect("/");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
     console.log('Server is started in port: ' + PORT);
});