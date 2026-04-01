import { EventEmitter } from 'events';

/**
 * Singleton EventEmitter for Helena SSE delivery.
 * Events are keyed by meetingSessionId.
 * Payload: HelenaReport JSON object.
 */
export const helenaEmitter = new EventEmitter();
helenaEmitter.setMaxListeners(50); // support up to 50 concurrent meetings
