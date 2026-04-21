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
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Set up signaling channel
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`call_${conversationId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'call-offer' }, async ({ payload }: any) => {
        if (payload.from === user.uid) return;
        setIncomingCall({ from: payload.from, type: payload.callType });
        setCallType(payload.callType);

        // Store the offer for when user accepts
        pcRef.current = createPeerConnection();
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
      })
      .on('broadcast', { event: 'call-answer' }, async ({ payload }: any) => {
        if (payload.from === user.uid || !pcRef.current) return;
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        setCallState('connected');
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
        if (payload.from === user.uid || !pcRef.current) return;
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      })
      .on('broadcast', { event: 'call-end' }, ({ payload }: any) => {
        if (payload.from === user.uid) return;
        endCall();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, from: user?.uid },
        });
      }
    };

    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    return pc;
  }, [user]);

  const getMediaStream = async (type: CallType) => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });
  };

  const startCall = async (type: CallType) => {
    if (!user || !channelRef.current) return;
    setCallType(type);
    setCallState('calling');

    try {
      const stream = await getMediaStream(type);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

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
      setCallState('idle');
    }
  };

  const acceptCall = async () => {
    if (!user || !pcRef.current || !channelRef.current) return;
    setCallState('connected');
    setIncomingCall(null);

    try {
      const stream = await getMediaStream(callType);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      stream.getTracks().forEach((track) => pcRef.current!.addTrack(track, stream));

      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      channelRef.current.send({
        type: 'broadcast',
        event: 'call-answer',
        payload: { answer, from: user.uid },
      });
    } catch (err) {
      console.error('Error accepting call:', err);
      endCall();
    }
  };

  const declineCall = () => {
    setIncomingCall(null);
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
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
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
