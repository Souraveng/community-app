import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
export type CallType = 'audio' | 'video';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// Add production TURN servers if configured
const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
const turnPass = process.env.NEXT_PUBLIC_TURN_PASSWORD;

if (turnUrl) {
  ICE_SERVERS.push({
    urls: turnUrl,
    username: turnUser,
    credential: turnPass
  });
}

export function useWebRTC(conversationId?: string, otherUserId?: string) {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: string; type: CallType } | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Auto-attach streams when refs or streams change
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState, localVideoRef.current]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('📺 Attaching remote stream to video element');
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, remoteVideoRef.current]);

  // Set up signaling channel
  useEffect(() => {
    if (!conversationId || !user) return;

    // Use a more unique channel name for signaling
    const channel = supabase.channel(`call_signaling_${conversationId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'call-offer' }, async ({ payload }: any) => {
        if (payload.from === user.uid) return;
        console.log('📞 Received call offer');
        setIncomingCall({ from: payload.from, type: payload.callType });
        setCallType(payload.callType);

        // Prepare the peer connection
        pcRef.current = createPeerConnection();
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
        } catch (err) {
          console.error('Failed to set remote description (offer):', err);
        }
      })
      .on('broadcast', { event: 'call-answer' }, async ({ payload }: any) => {
        if (payload.from === user.uid || !pcRef.current) return;
        console.log('✅ Received call answer');
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
          setCallState('connected');
        } catch (err) {
          console.error('Failed to set remote description (answer):', err);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
        if (payload.from === user.uid || !pcRef.current) return;
        console.log('❄️ Received ICE candidate');
        try {
          if (pcRef.current.remoteDescription) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            // Queue candidate or handle accordingly
            console.warn('Received ICE candidate before remote description');
          }
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      })
      .on('broadcast', { event: 'call-end' }, ({ payload }: any) => {
        if (payload.from === user.uid) return;
        console.log('🛑 Call ended by other party');
        endCall();
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') console.log('📡 Signaling channel active');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const createPeerConnection = useCallback(() => {
    console.log('🏗️ Creating RTCPeerConnection');
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        console.log('❄️ Sending local ICE candidate');
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, from: user?.uid },
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('🎬 Received remote track');
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔌 PeerConnection State:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState('connected');
      }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE Connection State:', pc.iceConnectionState);
    };

    return pc;
  }, [user]);

  const getMediaStream = async (type: CallType) => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
    } catch (err) {
      console.error('Access denied to camera/microphone:', err);
      throw err;
    }
  };

  const startCall = async (type: CallType) => {
    if (!user || !channelRef.current || isInitializing) return;
    setIsInitializing(true);
    setCallType(type);
    setCallState('calling');

    try {
      console.log(`🚀 Starting ${type} call`);
      const stream = await getMediaStream(type);
      localStreamRef.current = stream;
      
      const pc = createPeerConnection();
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      channelRef.current.send({
        type: 'broadcast',
        event: 'call-offer',
        payload: { offer, from: user.uid, callType: type },
      });
    } catch (err) {
      console.error('Error starting call:', err);
      endCall();
    } finally {
      setIsInitializing(false);
    }
  };

  const acceptCall = async () => {
    if (!user || !pcRef.current || !channelRef.current || isInitializing) return;
    setIsInitializing(true);
    setIncomingCall(null);

    try {
      console.log(`📥 Accepting ${callType} call`);
      const stream = await getMediaStream(callType);
      localStreamRef.current = stream;

      stream.getTracks().forEach((track) => pcRef.current!.addTrack(track, stream));

      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      channelRef.current.send({
        type: 'broadcast',
        event: 'call-answer',
        payload: { answer, from: user.uid },
      });
      
      setCallState('connected');
    } catch (err) {
      console.error('Error accepting call:', err);
      endCall();
    } finally {
      setIsInitializing(false);
    }
  };

  const declineCall = () => {
    console.log('👎 Rejection callback sent');
    if (channelRef.current && user) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call-end',
        payload: { from: user.uid },
      });
    }
    endCall();
  };

  const endCall = () => {
    console.log('🏁 Terminating call session');
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    setRemoteStream(null);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallState('idle');
    setIncomingCall(null);
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((prev) => !prev);
  };

  const toggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOff((prev) => !prev);
  };

  return {
    callState,
    callType,
    isMuted,
    isCameraOff,
    incomingCall,
    localVideoRef,
    remoteVideoRef,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
