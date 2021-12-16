const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt")
require("dotenv/config");

const mongoUser = process.env["MONGO_USER"];
const mongoSecret = process.env["MONGO_SECRET"];
const saltRounds = 10

const uri = `mongodb+srv://${mongoUser}:${mongoSecret}@loginform.2vkwz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri);

async function insertUser(data) {
    try {
        await client.connect();
    } catch {
        return Promise.resolve({
            status: 404,
            msg: "couldn't connect to MongoDB"
        });
    }
    const db = client.db("userData");
    const collection = db.collection("users");
    try {
        await collection.insertOne({
            name: data["Name"],
            email: data["Email"],
            password: await bcrypt.hash(data["Pass"], saltRounds)
        });
        return Promise.resolve({ status: 200, msg: "Success" });
    } catch {
        return Promise.resolve({ status: 404, msg: "Data insertion failed" });
    } finally {
        client.close(true);
    }
}

async function fetchData(data) {
    try {
        await client.connect();
    } catch {
        return Promise.resolve({
            status: 404,
            msg: "couldn't connect to MongoDB"
        });
    }
    const db = client.db("userData");
    const collection = db.collection("users");
    try {
        const existing = await collection.findOne({
            email: data["Email"]
        });
        const status = await bcrypt.compare(data["Password"], existing["password"])
        if (existing && status) {
            return Promise.resolve({ status: 200, userName: existing["name"] });
        } else {
            return Promise.reject({
                status: 400,
                msg: "User Id or Password disn't match"
            });
        }
    } catch {
        return Promise.reject({ status: 404, msg: "Data Fetch failed" });
    } finally {
        client.close(true);
    }
}

exports.insertUser = insertUser;
exports.fetchData = fetchData;
