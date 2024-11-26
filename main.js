// WebRTC variables
let localStream;
let peerConnection;
let remoteStream;

// Signaling server connection
const socket = io();

// DOM elements
const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");
const startCallBtn = document.getElementById("start-call-btn");
const endCallBtn = document.getElementById("end-call-btn");

const room = "JavaScript";  // Set the room based on the current room

// When the user joins the room
socket.emit('joinRoom', { username: 'User1', room });

startCallBtn.addEventListener("click", startVideoCall);
endCallBtn.addEventListener("click", endVideoCall);

// Get user media (camera and microphone)
async function getUserMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    } catch (err) {
        console.error("Error accessing media devices.", err);
    }
}

// Start video call
async function startVideoCall() {
    // Enable the end call button and disable start
    startCallBtn.style.display = "none";
    endCallBtn.style.display = "inline-block";

    // Get local media stream
    await getUserMedia();

    // Set up the peer connection
    peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]  // STUN server for NAT traversal
    });

    // Add local stream to peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Create an offer and send it to the other user
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Send the offer to the other user via signaling (Socket.IO)
    socket.emit('videoCall', { offer: offer, room });

    // Listen for ICE candidates
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('iceCandidate', { candidate: event.candidate, room });
        }
    };

    // Listen for remote stream
    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };
}

// Handle incoming video call offer
socket.on('videoCallOffer', async (data) => {
    peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]  // STUN server for NAT traversal
    });

    // Add local media to the peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Set remote description (received offer)
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));

    // Create an answer and send it back to the caller
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send the answer to the other user
    socket.emit('videoCallAnswer', { answer, room });

    // Listen for ICE candidates
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('iceCandidate', { candidate: event.candidate, room });
        }
    };

    // Listen for remote stream
    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };
});

// Handle video call answer from other user
socket.on('videoCallAnswer', async (data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

// Handle ICE candidate exchange
socket.on('iceCandidate', async (data) => {
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (err) {
        console.error("Error adding received ICE candidate", err);
    }
});

// End the video call
function endVideoCall() {
    // Close the peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    // Stop all media tracks
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    // Reset video elements
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;

    // Hide the end call button and show the start button
    startCallBtn.style.display = "inline-block";
    endCallBtn.style.display = "none";

    // Notify the server to end the call
    socket.emit('endCall', { room });
}
