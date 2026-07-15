const express=require('express');
const cors=require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const {jsdom, JSDOM} =require('jsdom');
const createDOMPurify=require('dompurify');
const mongoose=require('mongoose');
const bodyParser=require('body-parser');
const bcrypt=require('bcryptjs');
const { mongoClient}=require('mongodb');
const app=express();
const PORT=process.env.PORT || 3000;
const csurf=require("csurf");
const cookieParser=require("cookie-parser");
app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors({
origin: 'https://samulinukala.github.io',
credentials:true,
methods:['GET','POST','PUT']
}));




async function readData() {
const client=new mongoClient(process.env.uri2);
const database=client.Db('galleryData');
const userCred=database.collection('userCred');
query={username:"ericExample"};
const user=await userCred.findOne(query);
const window=new JSDOM('').window;
const dp=createDOMPurify(window);


console.log(user);
}
function generateToken(id)
{
const t=jwt.sign(id,process.env.jwtsk);
return t;
}
console.log( generateToken(200));
//readData().catch(console.dir);
async function hashPassword(password)
{
const epassword=await bcrypt.hash(password,9)
return(epassword);
}
async function testHash()
{
const testText="poop"
console.log(testText);
const hashTest=await hashPassword(testText);

bcrypt.compare(testText,hashTest,(err,result)=>
{
if(err)
{
console.error('error in compare',err);
return;
}
if(result)
{
console.log("match");

}else
{
console.log("no match")
}
});
console.log("test hash: "+hashTest);

}


const forumPostSchema=new mongoose.Schema({
    user:{type:String,required:true},
    title:{type:String,required:true},
    text:{type:String,required:true},
    section:{type:String,required:false},
})
const ForumPost=mongoose.model("ForumPost",forumPostSchema);
const userSchema=new mongoose.Schema(
{
username:{
    type:String,
    required:true
},
passwordHash:
{
type:String,
required:true
}
})
const User=mongoose.model("User",userSchema);
async function findUsersId(usernameToQry)
{
try{
const u=await User.findOne({"username" : usernameToQry})
if(!u){
return null;
}
return u._id.toString();
}catch (error){
console.error("error",error);
throw error;
}}
async function userListSearch(query)
{
const list= await User.find({username:{"$regex":query}});
console.log(list);
const thing=Array.from(list)
return thing;
}


async function getUser(username)
{try {
const user= await User.findOne({"username" : username});
return user;
}catch{return false}
}
async function checkPassword(userName,password)
{
const user= await getUser(userName);
console.log("password getting user"+ user);
if(user===null){ return false;} else{
const hash=  user.passwordHash;
console.log("retrived user"+user);

const res=await bcrypt.compare(password, hash);

if(res)
{
    console.log("matched");
return  true;
}else{
    console.log("not signed in")
     return false;
}
}
}

async function deleteUser(userId) 
{

    User.deleteOne({"_id":userId})
}

async function saveUser(username,password)
{
console.log("creating user");
bcrypt.hash(password,9).then((pHash)=>{
let u=new User({username:username,passwordHash:pHash})
u.save();

})

}

async function checkUsernameAvailability(username)
{
  try{
  const usero=await getUser(username);
    console.log("checked user "+ username);
   if( usero===null){console.log("username is free"); return true;} ;
    const user=usero.username;
  user===username ? 
      console.log("username exists" +user+" == "+username):
      console.log("usernameDoesNotExist "+user+" != "+username);
  let available;
  user===username ? available=true : available=false ;
  return !available;
}catch(e){
  console.error(e);
}
}
async function testSend()
{
    const testUser="eric_example";
    const coolTestHash=await hashPassword("eric_rules_hard");
    saveUser(testUser,coolTestHash);
}
function messageTemplate(message,un)
{
    un!=undefined ? this.un=un:this.un="Anonymous";
    message!=null?this.message=message:  this.message="";
    
}

let chatMessages=[]
sendChatMessage("welcome to the chat you can log in or not","starter");
function getChat()
{
return (chatMessages);
}

function removeForumPost(id){
ForumPost.deleteOne({id:id});

}


{/* forum functions */}


async function PostOnForum(user,header,text,section){
    try {
        let d = new ForumPost({user:user,title:header,text:text,section:section});
        await d.save();
        return true;
    } catch (error) {
        console.error("Error saving forum post:", error);
        return false;
    }
}

function retrivePostById(id)
{
    return db.find(ForumPost,{id:id});
}
//read database
function retrivePostsByTopic(topic){

    //read database
    return (ForumPost.find({ section: topic }));
}
// return to frontend

 function listTopics(){
    return (ForumPost.distinct("section"));
}
 
function consoleRenderChat()
{
chatMessages.map((m)=>{
console.log("-------------------");
console.log(m.un+": "+m.message);
console.log("-------------");
console.log("");


})
}

function sendChatMessage(message,un="Anonymous")
{
  
  const chatMessage=new messageTemplate(message,un)
  chatMessages.push(chatMessage);
}
//testSend();

app.put('/api/chat/sendMessage/:m',(req,res)=>{
var d=null;
req.cookies.userToken!=null ? d=jwt.verify(req.cookies.userToken,process.env.jwtsk) : console.log("no token");
d!=undefined ? sendChatMessage(req.params.m,d.userName) : sendChatMessage(req.params.m);
res.json({"succeeded":"message Sent"})
})
app.get('/api/chat/',(req,res)=>{
const c=getChat();
res.json(c);
})
app.get('/api/forum/getPostById/:id',async(req,res)=>{
const c=await retrivePostById(req.params.id);
return res.json(c);
})
app.get('/api/forum/listTopics/',async(req,res)=>{
    const d=await listTopics();
return res.status(202).json(d);
})
app.get('/api/forum/retrivePostByTopic/:topic',async(req,res)=>{
    const c=await retrivePostsByTopic(req.params.topic);
return res.json(c);
})
app.post('/api/forum/postMessage',async(req,res)=>
{

const c=await PostOnForum(jwt.verify(req.cookies.userToken,process.env.jwtsk),req.body.header,req.body.text,req.body.section);
c==true ? res.json({"succeeded":"post created"}) : res.json({"failed":"error creating post"});
})
app.get('/api/users/getAllUsers',(req,res)=>
{
getUsers().then(
(d)=>res.json(d)
)
})



mongoose.connect(process.env.uri2)
.then(()=>console.log('mongodb connect'))
.catch(err=>console.log(err));
PostOnForum("eric_example","testing post","long text","testresults");
listTopics();
app.get('/api/users/testCookie',(req,res)=>{
const ck=req.cookies;

res.json({"cookies":ck});
})
app.get('/',(req,res)=>
{
res.json({message:"sup backend"});
});

app.get('/api/users/findId/:userName',(req,res)=>
{

 findUsersId(req.params.userName).then(
(d)=>res.json(d)
)
})
app.post('/api/users/createUser',(req,res)=>
{
const un=req.body.parameter1;
const pw=req.body.parameter2;
checkUsernameAvailability(un).then((a)=>{
if(a===true)
{
saveUser(un,pw);
checkUsernameAvailability(un).then((a2)=>
{
a2===true? res.status(200).json({"account creation":"succeeded"}):res.status(500).json({"account creation":"failed user exists"})
})

}
else (res.status(500).json({"account creation":"failed"}))


})
})
app.get('/api/test/readCookie',(req,res)=>
{
const d=jwt.verify(req.cookies.userToken,process.env.jwtsk);
d!=undefined&& res.status(200).json({"token valid":d});

res.status(403);
})

app.post('/api/users/login', async(req,res)=>
{
const un=req.body.username;
const pw=req.body.password ;
let r=true;
const c= await getUser(un);
if(c===null){ res.status(403);return;}else{

if(r!=false){
const d= await checkPassword(un,pw)
if(d==true){
findUsersId(un).then((id)=>{
const token =jwt.sign({userId:id,userName: un},process.env.jwtsk,{expiresIn:'11hr',});
console.log("token: "+token)
res.cookie("userToken",token,{httpOnly:true,secure:true,sameSite:'none',maxAge:1000*60*60*11,partitioned:true});
res.json({"worked":"succeeded"});
})
}else{res.status(403).json({"forbidden":"false login"})}

}
}}
);
//saveUser("test2","pooop2").catch(console.dir);
console.log(userListSearch("test"));
app.listen(PORT,()=>{console.log(`server run on ${PORT}`)});
