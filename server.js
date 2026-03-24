const express=require('express');
const cors=require('cors');
require('dotenv').config();
const pes=require("perfect-express-sanitizer");
const mongoose=require('mongoose');
const bodyParser=require('body-parser');
const bcrypt=require('bcryptjs');
const { mongoClient}=require('mongodb');
const app=express();
const PORT=process.env.PORT || 3000;
async function readData() {
const client=new mongoClient(process.env.uri2);
const database=client.Db('galleryData');
const userCred=database.collection('userCred');
query={username:"ericExample"};
const user=await userCred.findOne(query);

console.log(user);
}
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
{
const user= await User.findOne({"username" : username});
return user;

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

async function saveUser(username,passwordHash)
{
console.log("creating user");
let u=new User({username:username,passwordHash:passwordHash})
await u.save();
console.log(u);
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
testHash();
testLogin();

//testSend();

app.use(bodyParser.json());
mongoose.connect(process.env.uri2)
.then(()=>console.log('mongodb connect'))
.catch(err=>console.log(err));
app.get('/',(req,res)=>
{
res.json({message:"sup backend"});
});
app.get('/api/users/:userName',(req,res)=>
{
 findUsersId(req.params.userName).then(
(d)=>res.json(d)
)
});

app.get('/api/users/login/:un&:pw'),(req,res)=>{
const un=pes.sanitize(  req.body.userName);
console.log(un);
const pw=pes.sanitize(req.body.pw) ;
console.log(pw);
res.json({un,pw})
}
//saveUser("test2","pooop2").catch(console.dir);
console.log(userListSearch("test"));


app.listen(PORT,()=>{console.log(`server run on ${PORT}`)});
