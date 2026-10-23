import Project from '../models/Project.js';
export const isAdmin=u=>u.role==='admin';
export async function getProjectAccess(user,projectId){const project=await Project.findById(projectId);if(!project)return {project:null,member:null};const member=project.members.find(m=>String(m.user)===String(user._id));return {project,member,isAdmin:isAdmin(user),isManager:isAdmin(user)||(user.role==='project_manager'&&member?.role==='manager')};}
export function forbidden(res,message='You do not have access to this resource.'){return res.status(403).json({error:{code:'FORBIDDEN',message}})}
export function notFound(res,message='Resource not found.'){return res.status(404).json({error:{code:'NOT_FOUND',message}})}
export function conflict(res,task){return res.status(409).json({error:{code:'CONFLICT',message:'This task changed since you opened it. Reload the latest version before saving.',latest:task}})}
