// Type definitions for ScoutzOS
export interface User {
    id: string;
    email: string;
    role: 'owner' | 'admin' | 'pm' | 'agent' | 'accountant' | 'viewer';
}
