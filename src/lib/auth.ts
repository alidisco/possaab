import { getDatabase } from './db';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
  is_active: number;
  created_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export function authenticateUser(email: string, password: string): AuthResult {
  try {
    const db = getDatabase();
    const user = db.prepare(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?'
    ).get(email) as (User & { password_hash: string }) | undefined;

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!user.is_active) {
      return { success: false, error: 'Account is disabled' };
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Log the login
    db.prepare(
      'INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES (?, ?, ?, ?)'
    ).run(user.id, 'login', 'user', JSON.stringify({ email: user.email }));

    const { password_hash, ...safeUser } = user;
    return { success: true, user: safeUser as User };
  } catch (error) {
    return { success: false, error: 'Database error' };
  }
}

export function getUserById(id: number): User | undefined {
  const db = getDatabase();
  return db.prepare(
    'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?'
  ).get(id) as User | undefined;
}

export function getAllUsers(): User[] {
  const db = getDatabase();
  return db.prepare(
    'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
  ).all() as User[];
}

export function createUser(name: string, email: string, password: string, role: 'admin' | 'cashier'): { success: boolean; error?: string } {
  try {
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return { success: false, error: 'Email already exists' };
    }
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, hash, role);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to create user' };
  }
}
