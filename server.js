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
async function testLogin()
{
const res=await checkUsernameAvailability("eric_example");
const res2=await checkUsernameAvailability("bad-name-example");
const res3=await checkPassword("eric_example","eric_rules_hard");
const res4=await checkPassword("bad-name-example","badhash");
console.log("result of namecheck "+res);
console.log("result of namecheck "+res2);
console.log("checking password with : eric example and hash res: "+res3);
 console.log("checking password with : junk. res: "+res4);
 
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

function consoleRenderChat()
{
chatMessages.map((m)=>{
console.log("-------------------");
console.log(m.un+": "+m.message);
console.log("-------------");
console.log("");


})
}

function sendChatMessage(message,un)
{
  
  const chatMessage=new messageTemplate(message,un)
  chatMessages.push(chatMessage);
}






//testSend();

app.put('/api/chat/sendMessage/:m',(req,res)=>{
sendChatMessage(req.params.m);
res.json({"succeeded":"message Sent"})
})
app.get('/api/chat/',(req,res)=>{
const c=getChat();
res.set('Access-Control-Allow-Origin','*');
res.set('Access-Control-Allow-Methods','GET,POST,PUT');
res.json(c);
})

app.use(bodyParser.json(),cors());
app.use(cookieParser());
mongoose.connect(process.env.uri2)
.then(()=>console.log('mongodb connect'))
.catch(err=>console.log(err));
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
app.get('/api/users/createUser/:un/:pw',(req,res)=>
{
checkUsernameAvailability(req.params.un).then((a)=>{
if(a===true)
{
saveUser(req.params.un,req.params.pw);
checkUsernameAvailability(req.params.un).then((a2)=>
{
a2===true? res.status(200).json({"account creation":"succeeded"}):res.status(500).json({"account creation":"failed"})
})

}
else (res.status(500).json({"account creation":"failed"}))


})
})

app.get('/api/users/login/:un/:pw',(req,res)=>
{
res.set('Access-Control-Allow-Origin','https://samulinukala.github.io');
res.set("Access-Control-Allow-Credentials: true")
res.set('Access-Control-Allow-Methods','GET,POST,PUT');
console.log("try");
console.log(req.params.un);
console.log(req.params.pw);
const un=req.params.un;
console.log(un);
const pw=req.params.pw ;

console.log(pw);
let r=true;
getUser(un).then((u)=>{if(u===null){ res.status(403);r=false;}})
if(r!=false){
checkPassword(un,pw).then(((d)=>{
if(d==true){
const id= findUsersId(un)
const token =jwt.sign({userId:id,userName:req.params.un},process.env.jwtsk,{expiresIn:'11h',});
res.cookie("userToken",token,{httpOnly:false});
res.json(token);
}else{res.status(403).json({"forbidden":"false login"})}

}))}
})
//saveUser("test2","pooop2").catch(console.dir);
console.log(userListSearch("test"));
app.listen(PORT,()=>{console.log(`server run on ${PORT}`)});
