const express = require("express"),
    es6Renderer = require("express-es6-template-engine"),
    bodyParser = require("body-parser"),
    session = require("express-session"),
    cookieParser = require("cookie-parser"),
    csrf = require("csurf"),
    { insertUser, fetchData } = require("./mongoDB");
require("dotenv/config");

const app = express();
const csrfProtection = csrf({ cookie: true });
app.engine("html", es6Renderer);
app.use(express.static("src/styles"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    session({
        secret: process.env["SERVER_SECRET"],
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 3600000 }
    })
);
app.set("views", "src/views");
app.set("view engine", "html");

app.get("/", (req, res) => {
    let session = req.session;
    if (session["userId"]) {
        res.redirect("/dashboard");
    } else {
        res.render("landing");
    }
});

app.get("/signup", csrfProtection, (req, res) => {
    let session = req.session;
    if (session["userId"]) {
        res.redirect("dashboard");
    } else {
        res.render("signup", { locals: { csrfToken: req.csrfToken() } });
    }
});

app.post("/signup", csrfProtection, (req, res) => {
    const data = req.body;
    let session = req.session;
    insertUser(data).then((resp) => {
        if (resp["status"] !== 200) {
            res.redirect("/signup");
        } else {
            session.userId = data["Email"];
            session.userName = data["Name"];
            res.redirect("/dashboard");
        }
    });
});

app.get("/login", csrfProtection, (req, res) => {
    let session = req.session;
    if (session["userId"]) {
        res.redirect("dashboard");
    } else {
        res.render("login", { locals: { csrfToken: req.csrfToken() } });
    }
});

app.post("/login", csrfProtection, (req, res) => {
    let session = req.session;
    const data = req.body;
    fetchData(data)
        .then((resp) => {
            session.userId = data["Email"];
            session.userName = resp["userName"];
            res.redirect("dashboard");
        })
        .catch((resp) => {
            res.status(resp["status"]).json({ msg: resp["msg"] });
        });
});

app.get("/dashboard", (req, res) => {
    let session = req.session;
    if (session["userId"]) {
        res.render("dashboard", { locals: { userName: session["userName"] } });
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    let session = req.session;
    session.destroy();
    res.redirect("/");
});

app.listen(5000, () => {
    console.log("Server Started");
});
