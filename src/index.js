const path=require('path')
const http=require('http')
const express=require('express')
const port=process.env.PORT || 3000
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage,generateLocationMessage}=require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

const app=express()
const server=http.createServer(app)
const io=socketio(server)

const publicDirectoryPath=path.join(__dirname,'../public')
app.use(express.static(publicDirectoryPath))

io.on('connection',(socket)=>{
   console.log('new loser just connected')


  socket.on('join',({username,room},callback)=>{
     const {error,user}= addUser({id:socket.id,username,room})
     if(error){
       return callback(error)
     }
     socket.join(user.room)
     socket.emit('message',generateMessage('System','Welcome!'))
     socket.broadcast.to(user.room).emit('message',generateMessage(user.username,`${user.username} has joined`))
     io.to(user.room).emit('roomData',{
       room:user.room,
       users:getUsersInRoom(user.room)
     })

     callback()
  })



  socket.on('relayMessage',(relay, callback)=>{
    const user=getUser(socket.id)
    const filter=new Filter()
    if(filter.isProfane(relay)){
      return callback('Profanity is not allowed')
    }
    io.to(user.room).emit('message',generateMessage(user.username,relay))
    callback()
  })
  socket.on('disconnect',()=>{
    const user=removeUser(socket.id)
    if(user){
      io.to(user.room).emit('message',generateMessage(user.username,`${user.username} has left!`))
      io.to(user.room).emit('roomData',{
        room:user.room,
        users:getUsersInRoom(user.room)
      })
    }
  })
  socket.on('data',(data,callback)=>{
    const user=getUser(socket.id)
    io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${data.latitude},${data.longitude}`))
    callback()
  })
})



server.listen(port,function(){
  console.log('port is running on port '+port)
})