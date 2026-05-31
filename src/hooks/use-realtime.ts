'use client'

import { useCallback, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

const REALTIME_EVENTS = [
  'queue:updated',
  'queue:position-changed',
  'queue:called',
  'queue:completed',
  'queue:cancelled',
  'agency:stats-updated',
  'admin:stats-updated',
  'admin:user-created',
] as const

export type RealtimeEvent = (typeof REALTIME_EVENTS)[number]

export function useRealtime(
  room: string | null,
  onEvent: (event: RealtimeEvent, data: unknown) => void
) {
  const socketRef = useRef<Socket | null>(null)

  // Use callback ref pattern to avoid lint errors about accessing refs during render
  const onEventCallback = useCallback((event: RealtimeEvent, data: unknown) => {
    onEvent(event, data)
  }, [onEvent])

  useEffect(() => {
    if (!room) return

    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log(`[realtime] Connected, joining room: ${room}`)
      socket.emit('join', room)
    })

    socket.on('disconnect', (reason) => {
      console.log(`[realtime] Disconnected: ${reason}`)
    })

    // Listen for all custom events
    REALTIME_EVENTS.forEach((event) => {
      socket.on(event, (data: unknown) => {
        onEventCallback(event, data)
      })
    })

    return () => {
      socket.emit('leave', room)
      socket.disconnect()
      socketRef.current = null
    }
  }, [room, onEventCallback])
}
