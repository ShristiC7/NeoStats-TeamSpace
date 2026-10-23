import bcrypt from 'bcryptjs';import jwt from 'jsonwebtoken';import User from '../models/User.js';
const safe=u=>({_id:u._id,name:u.name,email:u.email,role:u.role,active:u.active});
export async function login(req,res){const email=String(req.body.email||'').toLowerCase().trim(),password=String(req.body.password||'');const u=await User.findOne({email}).select('+passwordHash');if(!u||!u.active||!(await bcrypt.compare(password,u.passwordHash)))return res.status(401).json({error:{code:'INVALID_CREDENTIALS',message:'Email or password is incorrect.'}});const token=jwt.sign({sub:u._id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'8h'});res.json({token,user:safe(u)});}
export function me(req,res){res.json({user:safe(req.user)});}
