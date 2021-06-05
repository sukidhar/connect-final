
import { Component, OnInit, NgZone } from '@angular/core';
import {ActivatedRoute} from "@angular/router";



interface VideoElement{
  muted : boolean;
  srcObject : MediaStream;
  userId : String;
  userName : String;
};

declare global{
  interface Window{
    homeComponent : any
  }
}

declare const Peer:any;
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})



export class HomeComponent implements OnInit {
  videos : VideoElement[] = [];
  mainVideo = {} as VideoElement;
  myStream = {} as MediaStream;
  peer = {} as any;
  username = "";


  constructor(private route : ActivatedRoute,private zone : NgZone) { 
    window['homeComponent'] = {
      zone : this.zone,
      toggleVideoStream : (value:any)=> this.exposedToggleVideoStream(value),
      toggleAudioStream : (value:any)=> this.exposedToggleAudioStream(value),
      addMember : (data:any)=>this.exposedAddMemberToCall(data),
      endCall : (data:any)=>this.endCall(data),
      init : (value:any)=>this.initProp(value),
    };
  }

  exposedToggleVideoStream(value:any):void {
    this.myStream.getVideoTracks()[0].enabled = "true" == value;
  }

  exposedToggleAudioStream(value:any):void {
    this.myStream.getAudioTracks()[0].enabled = "true" == value;
  }


  endCall(userId:any):void{
    this.videos = this.videos.filter(video => video.userId !== userId);
  }

  exposedAddMemberToCall(data:any):void{
    navigator.mediaDevices.getUserMedia({
      audio:true,
      video:true,
    })
    .catch((err) => {
      console.error('[Error] Not able to retrieve user media:', err);
      return null;
    })
    .then((stream : MediaStream|null)=>{
      setTimeout(() => {
      const call = this.peer.call(data.userId, stream, {
        metadata: { userId: this.peer.id, userName : this.username},
        });
        call.on('stream', (otherUserVideoStream: MediaStream) => {
          console.log('receiving other user stream after his connection');
          this.addUserToVideoQueue(data.userName,data.userId, otherUserVideoStream);
        });

        call.on('close', () => {
          this.videos = this.videos.filter((video) => video.userId !== data.userId);
        });
      }, 1000);
    })
  }

  initProp(value:any):void{
    this.peer = new Peer(value.uid,{
      secure:true,
      host:"mad-project-android.herokuapp.com",
      port: 443,
    });
    this.listen(value);
    this.username = value.userName;
  }

  listen(data:any):void{
    navigator.mediaDevices.getUserMedia({
      audio:true,
      video:true
    })
    .catch((err) => {
      console.error('[Error] Not able to retrieve user media:', err);
      return null;
    })
    .then((stream : MediaStream|null)=>{
      if (stream){
        this.mainVideo.userId = data.uid;
        this.mainVideo.userName = data.userName;
        this.mainVideo.srcObject = stream;
        this.mainVideo.muted = true;
        this.myStream = stream;
        this.addUserToVideoQueue(data.userName,data.uid,stream);
      }

      this.peer.on('call', (call : any) => {
        console.log('receiving call...', call);
        call.answer(stream);
      
        call.on('stream', (callerStream: MediaStream) => {
          console.log('receiving other stream', callerStream);
          this.addUserToVideoQueue(call.metadata.userName,call.metadata.userId, callerStream);
        });

        call.on('error', (err:any) => {
          console.error(err);
        })
      })
    })
  }

  ngOnInit(): void {
    // const currentPeer = new Peer(uuidv4(),{
    //   host: '172.20.10.2',
    //   port : 9000,
    //   path : '/',
    //   secure : false,
    // })
    
    // console.log(currentPeer.id);
    // this.route.params.subscribe((params)=>{
    //   console.log(params);

    //   currentPeer.on('open', (userId:any)=> {
    //     this.socket.emit('join-meeting', {
    //       roomId : params.room,
    //       id: userId,
    //     });
    //   });
    // })

    // navigator.mediaDevices.getUserMedia({
    //   audio:true,
    //   video:true
    // })
    // .catch((err) => {
    //   console.error('[Error] Not able to retrieve user media:', err);
    //   return null;
    // })
    // .then((stream : MediaStream | null)=>{
    //   if(stream){
    //     this.mainVideo.srcObject = stream;
    //     this.mainVideo.muted = true;
    //     this.myStream = stream;
    //     this.addUserToVideoQueue("username","testerId",stream);
    //   }

    //   currentPeer.on('call', (call : any) => {
    //     console.log('receiving call...', call);
    //     call.answer(stream);
      

    //     call.on('stream', (callerStream: MediaStream) => {
    //       console.log('receiving other stream', callerStream);
    //       this.addUserToVideoQueue("joiner",call.metadata.userId, callerStream);
    //     });

    //     call.on('error', (err:any) => {
    //       console.error(err);
    //     })

    //   });

    //     this.socket.on('user-joined',(data:any)=>{
    //       console.log(`calling user with userid ${data.userId}`)
          
    //     })

    //     this.socket.on('user-disconnected', (userId:String) => {
    //       console.log(`receiving user-disconnected event from ${userId}`)
    //       this.videos = this.videos.filter(video => video.userId !== userId);
    //     });

    // })
  }

  onClick(videoElement : VideoElement){
    this.mainVideo = videoElement
  }

  onLoadedMetadata(event: Event) {
    (event.target as HTMLVideoElement).play();
  }
  
  addUserToVideoQueue(username : String, userId : String, videoStream : MediaStream ){
    const alreadyInCall = this.videos.some(video=>video.userId == userId);
    if (alreadyInCall){
      console.log("already in call");
      return;
    }
    this.videos.push({
      muted:false,
      srcObject : videoStream,
      userId : userId,
      userName : username
    })
  }
}

