const socket=io()

//EL
const $messageForm=document.querySelector('#form')
const $messageFormInput=$messageForm.querySelector('input')
const $messageFormButton=$messageForm.querySelector('button')
const $sendLocationButton=document.querySelector('#send-location')
const $messages=document.querySelector('#messages')

//Templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationMessageTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room}=Qs.parse(location.search, { ignoreQueryPrefix:true})

//AUTO scroll
const autoscroll=()=>{
  //New message element
  const $newMessage=$messages.lastElementChild
  //Height of message
  const newMessageStyles=getComputedStyle($newMessage)
  const newMessageMargin=parseInt(newMessageStyles.marginBottom)
  const newMessageHeight=$newMessage.offsetHeight +newMessageMargin
  //Visible height
  const visibleHeight=$messages.offsetHeight
  //Height of messages container
  const containerHeight=$messages.scrollHeight
  //How far have i scrolled
  const scrollOffset=$messages.scrollTop +visibleHeight

  if(containerHeight - newMessageHeight <= scrollOffset){
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on('message',(message)=>{
  console.log(message)
  const html = Mustache.render(messageTemplate,{
    username:message.username,
    message:message.text,
    createdAt:moment(message.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend',html)
  autoscroll()
})
$messageForm.addEventListener('submit',(e)=>{
  e.preventDefault()
  //Disable form while sending message
  $messageFormButton.setAttribute('disabled','disabled')
   const message=e.target.elements.text.value
   socket.emit('relayMessage',message,(error)=>{
     //Enable
     $messageFormButton.removeAttribute('disabled')
     $messageFormInput.value=''
     $messageFormInput.focus()
     if(error){
       return console.log('Error')
     }
     console.log('Message delivered')
   })
})

$sendLocationButton.addEventListener('click',(e)=>{
   if(!navigator.geolocation){
      return alert('Geolocation is not supported by your browser.')
   }
   $sendLocationButton.setAttribute('disabled','disabled')
   navigator.geolocation.getCurrentPosition((position)=>{
      socket.emit('data',{
        latitude: position.coords.latitude,
        longitude:position.coords.longitude
      },()=>{
        console.log('location shared')
      })
   })
   $sendLocationButton.removeAttribute('disabled')
})
socket.on('locationMessage',(message)=>{
  console.log(message)
  const html=Mustache.render(locationMessageTemplate,{
    username:message.username,
    url:message.url,
    createdAt:moment(message.created).format('h:mm a')
  })
   $messages.insertAdjacentHTML('beforeend',html)
   autoscroll()
})

socket.emit('join',{username,room},(error)=>{
   if(error){
     alert(error)
     location.href="/"
   }
})
socket.on('roomData',({room,users})=>{
  const html= Mustache.render(sidebarTemplate,{
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML=html
})