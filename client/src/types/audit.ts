export interface AuditLog {
  id: string;
  clientId: string | null;
  userId: string;
  action: string;
  details: string; // JSON string
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}
