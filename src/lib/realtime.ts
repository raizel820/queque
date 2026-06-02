// Internal helper to emit Socket.IO events from Next.js API routes
// Uses HTTP POST to the realtime service

const REALTIME_SERVICE_URL = process.env.REALTIME_SERVICE_URL || 'http://localhost:3003'
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || 'blasti-internal-2024'

export async function emitRealtimeEvent(room: string, event: string, data: unknown) {
  try {
    await fetch(`${REALTIME_SERVICE_URL}/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': INTERNAL_KEY,
      },
      body: JSON.stringify({ room, event, data }),
    })
  } catch (error) {
    console.error('[realtime] Failed to emit event:', error)
  }
}

// Convenience methods
export const realtime = {
  queueUpdated: (agencyId: string, data: unknown) =>
    emitRealtimeEvent(`agency:${agencyId}`, 'queue:updated', data),

  positionChanged: (userId: string, data: unknown) =>
    emitRealtimeEvent(`user:${userId}`, 'queue:position-changed', data),

  turnCalled: (userId: string, data: unknown) =>
    emitRealtimeEvent(`user:${userId}`, 'queue:called', data),

  serviceCompleted: (userId: string, data: unknown) =>
    emitRealtimeEvent(`user:${userId}`, 'queue:completed', data),

  reservationCancelled: (userId: string, data: unknown) =>
    emitRealtimeEvent(`user:${userId}`, 'queue:cancelled', data),

  agencyStatsUpdated: (agencyId: string, data: unknown) =>
    emitRealtimeEvent(`agency:${agencyId}`, 'agency:stats-updated', data),

  adminStatsUpdated: (data: unknown) =>
    emitRealtimeEvent('admin', 'admin:stats-updated', data),

  adminUserCreated: (data: unknown) =>
    emitRealtimeEvent('admin', 'admin:user-created', data),
}
