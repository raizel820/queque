/**
 * BLASTI Realtime Hook — Client-side Socket.IO connection
 *
 * Connects to the BLASTI realtime service (Socket.IO on port 3003 via Caddy gateway)
 * and provides real-time event subscriptions for queue updates, notifications, etc.
 *
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Room management (join/leave agency, customer, kiosk, admin rooms)
 * - Event subscriptions with cleanup
 * - Graceful fallback to polling when disconnected
 * - Connection status tracking
 *
 * Usage:
 *   const { isConnected, joinAgency, onQueueCalled } = useRealtime()
 *
 *   // Join an agency room to receive its updates
 *   joinAgency(agencyId)
 *
 *   // Subscribe to specific events
 *   onQueueCalled((data) => { ... })
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'

// ─── Types ─────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting'

export interface RealtimeEventData {
  type: string
  agencyId?: string
  userId?: string
  data: Record<string, unknown>
  timestamp: number
}

export type QueueEventData = RealtimeEventData
export type NotificationEventData = RealtimeEventData
export type KioskEventData = RealtimeEventData
export type ReservationEventData = RealtimeEventData
export type AgencyEventData = RealtimeEventData
export type StaffEventData = RealtimeEventData

type EventHandler = (event: RealtimeEventData) => void

// ─── Socket.IO Connection ─────────────────────────────────────────────────

const SOCKET_URL = '/'
const REALTIME_PORT = 3003

let globalSocket: Socket | null = null
let connectionCount = 0

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 10000,
      query: {
        XTransformPort: String(REALTIME_PORT),
      },
    })
  }
  return globalSocket
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useRealtime() {
  const socketRef = useRef<Socket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const listenersRef = useRef<Map<string, Set<(...args: unknown[]) => void>>>(new Map())

  // Initialize socket connection
  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket
    connectionCount++

    const onConnect = () => {
      setConnectionStatus('connected')
    }

    const onDisconnect = () => {
      setConnectionStatus('disconnected')
    }

    const onConnecting = () => {
      setConnectionStatus('connecting')
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('reconnect_attempt', onConnecting)
    socket.on('connect_error', onConnecting)

    if (!socket.connected) {
      socket.connect()
      setConnectionStatus('connecting')
    } else {
      setConnectionStatus('connected')
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('reconnect_attempt', onConnecting)
      socket.off('connect_error', onConnecting)

      connectionCount--
      if (connectionCount <= 0) {
        socket.disconnect()
        globalSocket = null
        connectionCount = 0
      }
    }
  }, [])

  // ─── Room Management ───────────────────────────────────────────────────

  const joinAgency = useCallback((agencyId: string) => {
    socketRef.current?.emit('join:agency', agencyId)
  }, [])

  const leaveAgency = useCallback((agencyId: string) => {
    socketRef.current?.emit('leave:agency', agencyId)
  }, [])

  const joinCustomer = useCallback((userId: string) => {
    socketRef.current?.emit('join:customer', userId)
  }, [])

  const leaveCustomer = useCallback((userId: string) => {
    socketRef.current?.emit('leave:customer', userId)
  }, [])

  const joinKiosk = useCallback((agencyId: string) => {
    socketRef.current?.emit('join:kiosk', agencyId)
  }, [])

  const leaveKiosk = useCallback((agencyId: string) => {
    socketRef.current?.emit('leave:kiosk', agencyId)
  }, [])

  const joinAdmin = useCallback(() => {
    socketRef.current?.emit('join:admin')
  }, [])

  const leaveAdmin = useCallback(() => {
    socketRef.current?.emit('leave:admin')
  }, [])

  // ─── Generic Event Subscription ────────────────────────────────────────

  const subscribe = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set())
    }
    listenersRef.current.get(event)!.add(handler)

    socketRef.current?.on(event, handler as (...args: unknown[]) => void)

    return () => {
      listenersRef.current.get(event)?.delete(handler)
      socketRef.current?.off(event, handler as (...args: unknown[]) => void)
    }
  }, [])

  const unsubscribe = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    listenersRef.current.get(event)?.delete(handler)
    socketRef.current?.off(event, handler as (...args: unknown[]) => void)
  }, [])

  // ─── Queue Event Subscriptions ────────────────────────────────────────

  const onQueueCreated = useCallback((handler: EventHandler) => {
    return subscribe('queue:created', handler)
  }, [subscribe])

  const onQueueUpdated = useCallback((handler: EventHandler) => {
    return subscribe('queue:updated', handler)
  }, [subscribe])

  const onQueueCalled = useCallback((handler: EventHandler) => {
    return subscribe('queue:called', handler)
  }, [subscribe])

  const onQueueCompleted = useCallback((handler: EventHandler) => {
    return subscribe('queue:completed', handler)
  }, [subscribe])

  const onQueueNoShow = useCallback((handler: EventHandler) => {
    return subscribe('queue:no-show', handler)
  }, [subscribe])

  const onQueueCancelled = useCallback((handler: EventHandler) => {
    return subscribe('queue:cancelled', handler)
  }, [subscribe])

  const onQueueJoined = useCallback((handler: EventHandler) => {
    return subscribe('queue:joined', handler)
  }, [subscribe])

  const onQueueWalkIn = useCallback((handler: EventHandler) => {
    return subscribe('queue:walk-in', handler)
  }, [subscribe])

  const onQueuePaused = useCallback((handler: EventHandler) => {
    return subscribe('queue:paused', handler)
  }, [subscribe])

  const onQueueResumed = useCallback((handler: EventHandler) => {
    return subscribe('queue:resumed', handler)
  }, [subscribe])

  const onQueuePositionChanged = useCallback((handler: EventHandler) => {
    return subscribe('queue:position-changed', handler)
  }, [subscribe])

  const onQueueSettingsUpdated = useCallback((handler: EventHandler) => {
    return subscribe('queue:settings-updated', handler)
  }, [subscribe])

  // ─── Reservation Event Subscriptions ─────────────────────────────────

  const onReservationCreated = useCallback((handler: EventHandler) => {
    return subscribe('reservation:created', handler)
  }, [subscribe])

  const onReservationUpdated = useCallback((handler: EventHandler) => {
    return subscribe('reservation:updated', handler)
  }, [subscribe])

  const onReservationCancelled = useCallback((handler: EventHandler) => {
    return subscribe('reservation:cancelled', handler)
  }, [subscribe])

  // ─── Notification Event Subscriptions ──────────────────────────────────

  const onNotification = useCallback((handler: EventHandler) => {
    return subscribe('notification:new', handler)
  }, [subscribe])

  const onTurnApproaching = useCallback((handler: EventHandler) => {
    return subscribe('notification:turn-approaching', handler)
  }, [subscribe])

  const onYourTurn = useCallback((handler: EventHandler) => {
    return subscribe('notification:your-turn', handler)
  }, [subscribe])

  // ─── Kiosk Event Subscriptions ────────────────────────────────────────

  const onKioskUpdate = useCallback((handler: EventHandler) => {
    return subscribe('kiosk:update', handler)
  }, [subscribe])

  // ─── Agency Event Subscriptions ──────────────────────────────────────

  const onAgencyUpdated = useCallback((handler: EventHandler) => {
    return subscribe('agency:updated', handler)
  }, [subscribe])

  // ─── Staff Event Subscriptions ───────────────────────────────────────

  const onStaffUpdated = useCallback((handler: EventHandler) => {
    return subscribe('staff:updated', handler)
  }, [subscribe])

  // ─── Any Event (for debug/logging) ────────────────────────────────────

  const onAnyEvent = useCallback((handler: (...args: unknown[]) => void) => {
    socketRef.current?.onAny(handler)
    return () => {
      socketRef.current?.offAny(handler)
    }
  }, [])

  return {
    // Connection state
    isConnected: connectionStatus === 'connected',
    connectionStatus,

    // Room management
    joinAgency,
    leaveAgency,
    joinCustomer,
    leaveCustomer,
    joinKiosk,
    leaveKiosk,
    joinAdmin,
    leaveAdmin,

    // Queue event subscriptions
    onQueueCreated,
    onQueueUpdated,
    onQueueCalled,
    onQueueCompleted,
    onQueueNoShow,
    onQueueCancelled,
    onQueueJoined,
    onQueueWalkIn,
    onQueuePaused,
    onQueueResumed,
    onQueuePositionChanged,
    onQueueSettingsUpdated,

    // Reservation event subscriptions
    onReservationCreated,
    onReservationUpdated,
    onReservationCancelled,

    // Notification event subscriptions
    onNotification,
    onTurnApproaching,
    onYourTurn,

    // Kiosk event subscriptions
    onKioskUpdate,

    // Agency event subscriptions
    onAgencyUpdated,

    // Staff event subscriptions
    onStaffUpdated,

    // Generic
    subscribe,
    unsubscribe,
    onAnyEvent,
  }
}
