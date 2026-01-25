export class TrafficLog {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip?: string;
  userAgent?: string;
  userId?: string | null;
  timestamp: Date;
}
