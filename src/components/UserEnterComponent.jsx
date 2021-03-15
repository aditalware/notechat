import React, { Component } from 'react';
import Video from 'twilio-video';
import { Client as ConversationsClient } from "@twilio/conversations";
import '../css/style.css';
import Axios from 'axios';




let connected = false;
let room;
let chat;
let conv;
let screenTrack;

// let dict = {};

let dict = new Map();

let now_streaming="";

let mentor;
let participant= new Map();

let recent_message;

const GetRequestApi = async(url,data) => {
    let timeout =10000 ;
    let response ={
        data:{},
        err:null
    }
    try {
        let resp = await Axios.post(url,data, {headers: getHeaders(),timeout:timeout});
       
        if(resp.data ){
            return resp.data;
        }
    }catch(error) {
        let resp = error;
        // throw error ;
        response.err=resp;
        return response
    }
};

const PostRequestApi = async(url,img) => {
    let timeout =10000 ;
    let response ={
        data:{},
        err:null
    }
    try {
        let resp = await Axios.post(url,img, {headers: getHeaders(),timeout:100000});
       
        if(resp.data ){
            return resp.data;
        }
    }catch(error) {
        let resp = error;
        // throw error ;
        response.err=resp;
        return response
    }
};


const getHeaders =() =>{
    let headers =
        { 'Content-Type': 'application/x-www-form-urlencoded',
            
         } ;
    return headers ;
 
 }

// async function addLocalVideo() {

//     let trackElement = await document.getElementById('video');

//     Video.createLocalVideoTrack().then(track => {
//         const localMediaContainer = document.getElementById('video');
//         localMediaContainer.appendChild(track.attach());
//         // let video = document.getElementById('myVideo');
//         // let trackElement = track.attach();
//         // trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
//         // video.appendChild(trackElement);
//         // console.log(trackElement);
//         // trackElement.setAttribute("id", "video2");
//         // console.log(video);
//     });
// };


async function capture1() {
    var canvas = await document.getElementById('canvas');
    var video = await document.getElementById('video');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);  
    var img1 = canvas.toDataURL();
    
    // $.ajax({
    //             url: '/process1',
    //             data: {
    //                 imageBase64 : img1                    
    //             },
    //             type: 'POST',
    //             success: function(data){
    //                 // $("#result").text("Predicted Output : "+data);
    //                 // canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight); 
    //                 console.log("success!!")
    //                 // console.log(data)
    //                 conv.sendMessage(data);
    //             } 
    //         })


    let url="https://7f952336981f.ngrok.io/process_image";
    let dataTosend=JSON.stringify({img:img1});
    PostRequestApi(url,dataTosend).then(data => {
        console.log(data);
        conv.sendMessage(data.ans);
        
    }).catch(e => {
        console.log(e);
        
    });

    // conv.sendMessage("https://i.pinimg.com/originals/83/f9/37/83f937b69f30bb886ab8a03390da6771.jpg");
};

async function assignMentor(event){
    const usernameInput =await document.getElementById('username');
    mentor = usernameInput.value;
    now_streaming = mentor;
    connectButtonHandler(event);
    
    // console.log(mentor);
    // Disable Mentor Button
    // document.getElementById('join_leave_mentor').style.display = "none";
    // document.getElementById('Turn').style.display = "none";
    
}
async function assignStudent(event){
    const usernameInput =await document.getElementById('username');
    console.log(usernameInput.value);
    connectButtonHandler(event);
    
    // console.log(mentor);
    // Disable Mentor Button
    // document.getElementById('join_leave_mentor').style.display = "none";
    // document.getElementById('Turn').style.display = "none";
    
}




async function connectButtonHandler(event) {
    // event.preventDefault();
    // const button = await document.getElementById('join_leave_student');
    const lableInput =await document.getElementById('one');
    const shareScreen = await document.getElementById('share_screen');
    const usernameInput = await document.getElementById('username');

    if (!connected) {
        let username = usernameInput.value;
        if (!username) {
            alert('Enter your name before connecting');
            return;
        }
        // button.disabled = true;
        // button.innerHTML = 'Connecting...';
        if(String(username)!=="undefined" && !participant[username]){
            participant[username]=true;

        connect(username).then(() => {
            lableInput.innerHTML = username;
            // button.innerHTML = 'Leave call';
            // button.disabled = false;
            shareScreen.disabled = false;
            // capture.disabled = false;
        }).catch(() => {
            alert('Connection failed. Is the backend running?');
            // button.innerHTML = 'Join call';
            // button.disabled = false;
        });}
    }
    else {
        disconnect();
        // button.innerHTML = 'Join call';
        connected = false;
        shareScreen.innerHTML = 'Share screen';
        shareScreen.disabled = true;
        // capture.disabled = true;
    }
};

async function connect(username) {
    let url="https://7f952336981f.ngrok.io/login";
   
    const usernameInput =await document.getElementById('username');
    const localDiv =await document.getElementById('local');

    let promise = new Promise((resolve, reject) => {
        // get a token from the back end
        let data={username:usernameInput.value};
         GetRequestApi(url,data).then(_data => {
            // join video call
            data = _data;
            return Video.connect(String(data.token));
        }).then(_room => {
            room = _room;
            if(username != now_streaming){
                localDiv.className = "participantHidden";
            }
            if(username == now_streaming){
                localDiv.className = "participant";
            }
            room.participants.forEach(participantConnected);
            room.on('participantConnected', participantConnected);
            room.on('participantDisconnected', participantDisconnected);
            connected = true;
            updateParticipantCount();
            devicesDisplay();
            connectChat(data.token, data.conversation_sid);
            resolve();
        }).catch(e => {
            console.log(e);
            reject();
        });
    });
    return promise;
};


async function attachTracks(tracks) {
    const container =await document.getElementById('myVideo');

  tracks.forEach(function(track) {
    if (track) {
          let d = document.getElementById("myVideo");
      console.log(d.childNodes);
      try{
        d.removeChild(d.childNodes[0]);
      }catch(e){
         console.log(e);
      }
      let v = track.attach();
      v.setAttribute('id','video');
      console.log(v);
      container.appendChild(v);
    
    }
  });
  // console.log("Hrll");
   
}

function detachTracks(tracks) {
  tracks.forEach(function(track) {
    if (track) {
      track.detach().forEach(function(detachedElement) {
        detachedElement.remove();
      });
    }
  });
}


function stopTracks(tracks) {
  tracks.forEach(function(track) {
    if (track) { track.stop(); }
  })
}



async function devicesDisplay(){
  navigator.mediaDevices.enumerateDevices().then(gotDevices);
  const select = await document.getElementById('video-devices');
  select.addEventListener('change', updateVideoDevice);

}

async function gotDevices(mediaDevices) {
  console.log("KK");
  const select = await document.getElementById('video-devices');
//   select.innerHTML = `<option value="0">
//                Select Camera
//                 </option>`;
  
  let count = 0;
  mediaDevices.forEach(mediaDevice => {
    if (mediaDevice.kind === 'videoinput') {
      const option = document.createElement('option');
      option.value = mediaDevice.deviceId;
      const label = mediaDevice.label || `Camera ${count++}`;
      const textNode = document.createTextNode(label);
      option.appendChild(textNode);
      select.appendChild(option);
    }
  });
}


function updateVideoDevice(event) {
  const select = event.target;
  const localParticipant = room.localParticipant;
  if (select.value !== '') {
    const tracks = Array.from(localParticipant.videoTracks.values()).map(
      function(trackPublication) {
        return trackPublication.track;
      }
    );
    localParticipant.unpublishTracks(tracks);
    console.log(localParticipant.identity + ' removed track: ' + tracks[0].kind);

    detachTracks(tracks);
    stopTracks(tracks);
    Video.createLocalVideoTrack({
      deviceId: { exact: select.value }
    }).then(function(localVideoTrack) {
      localParticipant.publishTrack(localVideoTrack);
      console.log(localParticipant.identity + ' added track: ' + localVideoTrack.kind);
      const previewContainer = document.getElementById('myVideo');
      attachTracks([localVideoTrack], previewContainer);
    });
  }
}



async function updateParticipantCount() {
    const count = await document.getElementById('count');

    
    if (!connected)
        count.innerHTML = 'Disconnected.';
    else
        count.innerHTML = (room.participants.size + 1) + ' participants online.';
};



async function participantConnected(participant) {
    const container =await document.getElementById('container');

    let participantDiv = document.createElement('div');
    participantDiv.setAttribute('id', participant.sid);
    
if(participant.identity == now_streaming){
    participantDiv.setAttribute('class','participant');
}
else {
    participantDiv.setAttribute('class','participantHidden');   
}
    let tracksDiv = document.createElement('div');
    participantDiv.appendChild(tracksDiv);

    let labelDiv = document.createElement('div');
    labelDiv.setAttribute('class', 'label');
    labelDiv.innerHTML = participant.identity;
    participantDiv.appendChild(labelDiv);

    dict[participant.identity] = participant.sid;

    container.appendChild(participantDiv);

    participant.tracks.forEach(publication => {
        if (publication.isSubscribed)
            trackSubscribed(tracksDiv, publication.track);
    });
    participant.on('trackSubscribed', track => trackSubscribed(tracksDiv, track));
    participant.on('trackUnsubscribed', trackUnsubscribed);

    updateParticipantCount();
};

async function participantDisconnected(participant) {
  let a= await document.getElementById(participant.sid);
  a.remove();
    updateParticipantCount();
};

function trackSubscribed(div, track) {
    let trackElement = track.attach();
    trackElement.addEventListener('click', () => { zoomTrack(trackElement); });
    div.appendChild(trackElement);
};

function trackUnsubscribed(track) {
    track.detach().forEach(element => {
        if (element.classList.contains('participantZoomed')) {
            zoomTrack(element);
        }
        element.remove()
    });
};

async function disconnect() {
    const toggleChat =await document.getElementById('toggle_chat');
    const root = await document.getElementById('root');
    const container =await document.getElementById('container');

    room.disconnect();
    if (chat) {
        chat.shutdown().then(() => {
            conv = null;
            chat = null;
        });
    }
    while (container.lastChild.id != 'local')
        container.removeChild(container.lastChild);
    // button.innerHTML = 'Join call';
    if (root.classList.contains('withChat')) {
        root.classList.remove('withChat');
    }
    toggleChat.disabled = true;
    connected = false;
    updateParticipantCount();
};

async function shareScreenHandler() {
    // event.preventDefault();
    const shareScreen = await document.getElementById('share_screen');

    if (!screenTrack) {
        navigator.mediaDevices.getDisplayMedia().then(stream => {
            screenTrack = new Video.LocalVideoTrack(stream.getTracks()[0]);
            room.localParticipant.publishTrack(screenTrack);
            screenTrack.mediaStreamTrack.onended = () => { shareScreenHandler() };
            console.log(screenTrack);
            shareScreen.innerHTML = 'Stop sharing';
        }).catch(() => {
            alert('Could not share the screen.')
        });
    }
    else {
        room.localParticipant.unpublishTrack(screenTrack);
        screenTrack.stop();
        screenTrack = null;
        shareScreen.innerHTML = 'Share screen';
    }
};

async function zoomTrack(trackElement) {
    const container =await document.getElementById('container');



    if (!trackElement.classList.contains('trackZoomed')) {
        // zoom in
        container.childNodes.forEach(participant => {
            if (participant.classList && participant.classList.contains('participant')) {
                let zoomed = false;
                participant.childNodes[0].childNodes.forEach(track => {
                    if (track === trackElement) {
                        track.classList.add('trackZoomed')
                        zoomed = true;
                    }
                });
                if (zoomed) {
                    participant.classList.add('participantZoomed');
                }
                else {
                    participant.classList.add('participantHidden');
                }
            }
        });
    }
    else {
        // zoom out
        container.childNodes.forEach(participant => {
            if (participant.classList && participant.classList.contains('participant')) {
                participant.childNodes[0].childNodes.forEach(track => {
                    if (track === trackElement) {
                        track.classList.remove('trackZoomed');
                    }
                });
                participant.classList.remove('participantZoomed')
                participant.classList.remove('participantHidden')
            }
        });
    }
};

 async function connectChat(token, conversationSid) {
    const chatContent =await document.getElementById('chat-content');
    const toggleChat = await document.getElementById('toggle_chat');
    const usernameInput = await document.getElementById('username');
    return ConversationsClient.create(token).then(_chat => {//change
        chat = _chat;
        return chat.getConversationBySid(conversationSid).then((_conv) => {
            conv = _conv;
            conv.on('messageAdded', async(message) => {
                const val = await parseURL(message.author, message.body);
                if(val == 0)
                    addMessageToChat(message.author, message.body);
            });
            return conv.getMessages().then((messages) => {
                chatContent.innerHTML = '';
                console.log(messages.items.map((m)=>m.body));
                if(usernameInput.value == mentor){
                    conv.sendMessage('Mentor joined '+mentor);
                    
                }
                // alert("Let See");
                // for (let i = 0; i < messages.items.length; i++) {
                //     addMessageToChat(messages.items[i].author, messages.items[i].body);
                // }
                toggleChat.disabled = false;
            });
        });
    }).catch(e => {
        console.log(e);
    });
};

async function addMessageToChat(user, message) {
    const chatContent = await document.getElementById('chat-content');
    const chatScroll = await document.getElementById('chat-scroll');


    chatContent.innerHTML += `<p><b>${user}</b>: ${message}`;
    chatScroll.scrollTop = chatScroll.scrollHeight;
}

async function toggleChatHandler() {
    const chatScroll = await document.getElementById('chat-scroll');
    const root = await document.getElementById('root');

    // event.preventDefault();
    if (root.classList.contains('withChat')) {
        root.classList.remove('withChat');
    }
    else {
        root.classList.add('withChat');
        chatScroll.scrollTop = chatScroll.scrollHeight;
    }
};

async function onChatInputKey(ev) {
    console.log('chat');
    // console.log(ev);

    const chatInput = await document.getElementById('chat-input');
    // console.log(chatInput.value);
    const usernameInput = await document.getElementById('username');


    if (ev.keyCode == 13) {//enter
        console.log('enter pressed')
        // console.log(conv);
        // console.log(conv.sendMessage(chatInput.value));
        conv.sendMessage(chatInput.value);
        // conv.emit('messageAdded',{author:usernameInput.value,body:chatInput.value});
        chatInput.value = '';
    }
};




async function parseURL(author, message) {
    const images = await document.getElementById('imageDiv');

    if(message.startsWith("https")){
        // document.getElementById("myImg").src = message;

        let image = document.createElement('img');

        image.setAttribute('class','myImg');

        image.setAttribute('src',message);

        images.appendChild(image);

        return 1;

    }
    else if(message.startsWith("accept")){

        recent_message = author;
    
    }
    else if(message.startsWith("Access Granted ")== true && author == mentor){
        var now_id = dict[now_streaming];
        var want_id = dict[author];
        
        if(now_id==undefined){
            now_id = "local";
        }
        if(want_id == undefined){
            want_id = "local";
        }

        console.log(now_id);
        console.log(want_id);

        if(now_id != want_id){
            document.getElementById(now_id).setAttribute('class','participantHidden');
            document.getElementById(want_id).setAttribute('class','participant');
        }
        now_streaming = author;
    }

    else if(message.startsWith("Access Allowed") == true && author == mentor){
        
        var now_id = dict[now_streaming];
        var want_id = dict[recent_message];
        
        if(now_id==undefined){
            now_id = "local";
        }
        if(want_id == undefined){
            want_id = "local";
        }

        console.log(now_id);
        console.log(want_id);

        if(now_id != want_id){
            document.getElementById(now_id).setAttribute('class','participantHidden');
            document.getElementById(want_id).setAttribute('class','participant');
        }
        now_streaming = recent_message;

    }
    else if(message.startsWith("Mentor joined") == true){
        var want_id = dict[author];
        if(want_id == undefined){
            want_id = "local";
        }
        document.getElementById(want_id).setAttribute('class','participant');

        now_streaming = author;
        mentor = author;
    }
    else if(message.startsWith("clear screen") == true && author == mentor){
        images.innerHTML = "";
    }

    return 0;
}


function onStart() {
    if (
        !"mediaDevices" in navigator ||
        !"getUserMedia" in navigator.mediaDevices
    ) {
        alert("Camera API is not available in your browser");
        return;
    }

    // get page elements
    const video = document.querySelector("#video");

    // video constraints
    const constraints = {
        video: {
            width: {
                min: 1280,
                ideal: 1920,
                max: 2560,
            },
            height: {
                min: 720,
                ideal: 1080,
                max: 1440,
            },
        },
    };

    // use front face camera
    let useFrontCamera = true;

    // current video stream
    let videoStream;

    
    async function initializeCamera() {
        if (videoStream) {
            videoStream.getTracks().forEach((track) => {
                track.stop();
            });
        }
        constraints.video.facingMode = useFrontCamera ? "user" : "environment";

        try {
            videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = videoStream;
        } catch (err) {}
    }

    initializeCamera();
}


function Student(){
    return(<div>

    </div>);
}
function Mentor(){
    return(<div>

    </div>);
}

class UserEnterComponent extends Component {

    constructor(props){
        super(props);
        this.state={
            name:"",
            code:"",
            localDiv:null,
            count:0,
            student:false,
            mentor:false
        }
        this.handleSubmit=this.handleSubmit.bind(this);
        this.setlocalPartipantDiv=this.setlocalPartipantDiv.bind(this);
        this.setCount=this.setCount.bind(this);
    }

    async componentDidMount (){
       onStart();
   
    }
    setlocalPartipantDiv(name){
        this.setState({localDiv:name})
    }

    setCount(count){
        this.setState({count:count})
    }
    setRole(role){
        if(role=="student"){
     this.setState({student:true});
    assignStudent();
    }
        else{

            this.setState({mentor:true});
            assignMentor();
        }


    }
    handleSubmit(event){
     event.preventDefault();
    }


    render() {

        // if(!this.state.student && !this.state.mentor)
        return (
            <div>
               <div className="maindiv" >
                                            <div className="style1">
                                            </div>
                                            <div className="head titlefor">
                                                <h1 className="headingfor">OnBoard</h1>
                                            </div>

                                            <form className="formstyle formfor" onSubmit={this.handleSubmit}>
                                                    <div id="name" className="namefield">
                                                        <label for="username" className="style2">{(!this.state.student && !this.state.mentor)?"Enter Name":("Welcome ")}{(!this.state.student && !this.state.mentor)?"": <i class="fas fa-smile-wink"></i>} </label>
                                                    </div>
                                                    <div id="name_input" className="nameinput">
                                                        <i className="fas fa-user style3"></i> 

                                                        <input type="text" autocomplete="off"  className="inputfield" name="username" id="username" onChange={(e)=>this.setState({name:e.target.value})}/>


                                                    </div>
                                                    {(!this.state.student && !this.state.mentor)?
                                                    <>
                                                        <div id="room" className="roomcode">
                                                            <label for="code" className="style2">Enter Room Code</label>
                                                        </div>


                                                    <div id="room_input" className="iconfor">
                                                        <i className="fas fa-key style3"></i> 
                                                        <input type="text" className="inputfield2" name="code" id="code" onChange={(e)=>this.setState({code:e.target.value})}/>
                                                    </div>
                                                    </>:<div></div>}


                                                        <div className="statusfield">
                                                            <p id="count" className="style2 style4">Disconnected</p>
                                                        </div>

                                                        
                                                    {(!this.state.student && !this.state.mentor)?<div className="style5">
                                                        <div id="panel" className="joinfield">
                                                            <div className="asfield">
                                                                Join As
                                                            </div>
                                                            <div className="style7">
                                                                {/* <button type="submit" className="b1 style7"  onClick="JoinedAs()">Student</button> */}
                                                                <button  className="b1 style7" id="join_leave_student" onClick={(e)=>{ this.setRole("student");assignStudent()}} >Student</button>
                                                                <button  className="b2 style8" id="join_leave_mentor" onClick={(e)=>{this.setRole("mentor");assignMentor()}}>Mentor</button>
                                                            </div>
                                                        </div>
                                                       
                                                    </div>:<div></div>}
            {/* <!-- <button id="toggle_chat" disabled>Toggle chat</button> --> */}
                                    </form>


        <div >
                           

        {(this.state.mentor || this.state.student) ?
        <div className="btngr">
            <button id="share_screen" className="btnsharescreen" >

                <i className="fa fa-2x fa-desktop"> </i>

                <span className="tooltiptext">Share Screen</span>
            </button>
            <button id="toggle_chat" className="btntogglechat" onClick={()=>{toggleChatHandler()}} >
                
                <i className="fa fa-2x fa-comment style3"> </i>

                <span className="tooltiptext">Toggle Chat</span>
            </button>
            <a href="/"><button id="Leave_call" className="btnleave">
                <i className="fa fa-2x fa-phone style3" > </i>

                <span className="tooltiptext">Leave Call</span>
            </button></a>
        </div>:<div></div>}


        {(this.state.mentor || this.state.student) ?
          <div className="cameradiv">

                    <select id="video-devices" className="optionCamera">
                        <option value="0">
                           Select Camera
                        </option>
                    </select>
            </div>:<div></div>}

            
            {(this.state.mentor || this.state.student) ?  
            <div id="root">
                    <div id="container" className="containers containeradd">
                                        <div id="local" className={this.state.localDiv==null?"participant":this.state.localDiv}>
                                                    <div id="myVideo" className="vids
                                                        ">
                                                        <video autoPlay playsInline id="video"></video>
                                                    </div>

                                                                                               
                                                        <div id="one" className="label rootlabel
                                                    ">
                                                        </div>
                                        </div>
                                        <div id="imageDiv">
                                                {/* <!-- <img src="#" id="myImg" style="width: 400px; height: 308px; position: absolute; margin: auto; opacity: 0.5; left: 37%">
                        --> */}
                                        </div>
                            {/* <!-- more participants will be added dynamically here --> */}
                        </div>
        <canvas disabled id="canvas" className="canvasstyle"></canvas>
        <div id="somebuttons">
                        <button className="btnaskdoubt" onClick={()=>{ conv.sendMessage("accept " + this.state.name);}} id="Turn">

                            <i className="fa fa-2x fa-question-circle style3" > </i>

                            <span className="tooltiptext">Ask Doubt</span>
                        </button>
                            <button className="btncapture" id="capture" onClick={()=>{capture1()}}>
                            
                                
                                    <i className="fa fa-2x fa-camera"> </i>

                                        <span className="tooltiptext">Capture Screenshot</span>

                            </button>
                        <button className="btnclearscreen" onClick={()=>{ conv.sendMessage("clear screen");}} id="cls">
                            <i className="fa fa-2x fa-hand-rock"></i>
                            <span className="tooltiptext">Clear Screen</span>
                        </button>
        </div>


             <div id="chat" className="chatstyle">
                        <div className="chatscrolls" id="chat-scroll" >
                            <div id="chat-content">
                                {/* <!-- chat content will be added dynamically here --> */}
                            </div>
                        </div>

                        <div className="chatin">
                            <input id="chat-input" placeholder="Type Your Query" className="chatinput" type="text" onKeyUp={(e)=>{onChatInputKey(e)}}/>
                        </div>

                    <div className="style11">

                                <div>
                                    <button id="Allow" onClick={()=>{  conv.sendMessage("Access Allowed to "+recent_message);}} className="allowbtn btnallow">
                                        <i className="fa fa-2x fa-hand-pointer style3" > </i>
                
                                        <span className="tooltiptext">Allow</span>
                                    </button>
                                </div>
                                <div className="btnturnover">
                                    <button id="turn_over" onClick={()=>{conv.sendMessage("Access Granted to "+mentor);
                                          }} className="turnoverbtn style10" >
                                        <i className="fa fa-2x fa-retweet style3" ></i>
                                        <span className="tooltiptext">Turn Over</span>
                    
                                    </button>
                                </div>
                    </div>
            </div>

</div>:<div></div>}


      </div>
        
       
    </div>
                <script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
                <script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
                <script src="https://media.twiliocdn.com/sdk/js/video/releases/2.3.0/twilio-video.min.js"></script>
                <script src="https://media.twiliocdn.com/sdk/js/conversations/releases/1.0.0/twilio-conversations.min.js"></script>
    </div>
            
        )
        // else if(this.state.student){
        //     return(<Student/>)
        // }
        // else{
        //     return(<Mentor/>)
        // }
    }
}

export default  UserEnterComponent;