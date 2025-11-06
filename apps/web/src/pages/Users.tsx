import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Nav } from '../components/Nav';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../lib/useToast';
import { ValidationMessage } from '../components/ValidationMessage';

interface User {
  id: string;
  email: string;
  role: string;
  mfaEnabled: boolean;
  createdAt: string;
}

export function Users() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'viewer'
  });
  const [validationError, setValidationError] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/users')).data
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) =>
      (await api.post('/users', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setFormData({ email: '', password: '', role: 'viewer' });
      setValidationError('');
      showToast('success', 'User created successfully');
    },
    onError: (err: any) => {
      setValidationError(err.response?.data?.message || 'Failed to create user');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) =>
      (await api.patch(`/users/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      showToast('success', 'User updated successfully');
    },
    onError: () => {
      showToast('error', 'Failed to update user');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteUserId(null);
      showToast('success', 'User deleted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user';
      showToast('error', errorMessage);
      console.error('Delete user error:', error);
    }
  });

  const getRoleBadgeStyle = (role: string) => {
    const roleUpper = role?.toUpperCase();
    if (roleUpper === 'ADMIN') return { bg: 'rgba(156, 39, 176, 0.1)', color: '#9C27B0' };
    if (roleUpper === 'EDITOR') return { bg: 'rgba(21, 101, 192, 0.1)', color: 'var(--accent-primary)' };
    return { bg: 'rgba(158, 158, 158, 0.1)', color: 'var(--text-secondary)' };
  };

  return (
    <>
      <Nav />
      <div style={{
        padding: '32px 24px',
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: '8px'
            }}>
              Users
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              Manage user accounts and permissions
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + Create User
          </button>
        </div>

        {/* Create/Edit Form */}
        {(showCreate || editingUser) && (
          <div style={{
            padding: '24px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: '20px'
            }}>
              {editingUser ? 'Edit User' : 'Create New User'}
            </h2>
            
            {validationError && (
              <ValidationMessage message={validationError} type="error" />
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={editingUser?.email || formData.email}
                onChange={(e) => {
                  if (editingUser) {
                    setEditingUser({ ...editingUser, email: e.target.value });
                  } else {
                    setFormData({ ...formData, email: e.target.value });
                  }
                }}
                placeholder="user@example.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {!editingUser && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                Role
              </label>
              <select
                value={editingUser?.role || formData.role}
                onChange={(e) => {
                  if (editingUser) {
                    setEditingUser({ ...editingUser, role: e.target.value });
                  } else {
                    setFormData({ ...formData, role: e.target.value });
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  if (editingUser) {
                    updateMutation.mutate({
                      id: editingUser.id,
                      data: { email: editingUser.email, role: editingUser.role }
                    });
                  } else {
                    createMutation.mutate(formData);
                  }
                }}
                disabled={editingUser ? false : (!formData.email || !formData.password)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: (editingUser || (formData.email && formData.password))
                    ? 'var(--accent-primary)'
                    : 'var(--text-tertiary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (editingUser || (formData.email && formData.password)) ? 'pointer' : 'not-allowed'
                }}
              >
                {editingUser ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setEditingUser(null);
                  setFormData({ email: '', password: '', role: 'viewer' });
                  setValidationError('');
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          {isLoading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading users...
            </div>
          ) : !users || users.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                No users yet
              </p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Email
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Role
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    MFA
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Created
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: User, idx: number) => {
                  const roleBadge = getRoleBadgeStyle(user.role);
                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none'
                      }}
                    >
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: 'var(--text-primary)'
                      }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          borderRadius: '12px',
                          backgroundColor: roleBadge.bg,
                          color: roleBadge.color,
                          textTransform: 'capitalize'
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          backgroundColor: user.mfaEnabled
                            ? 'rgba(76, 175, 80, 0.1)'
                            : 'rgba(158, 158, 158, 0.1)',
                          color: user.mfaEnabled ? 'var(--success)' : 'var(--text-secondary)'
                        }}>
                          {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{
                        padding: '16px',
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{
                        padding: '16px',
                        textAlign: 'right'
                      }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setEditingUser(user)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '13px',
                              fontWeight: 500,
                              backgroundColor: 'transparent',
                              color: 'var(--accent-primary)',
                              border: '1px solid var(--accent-primary)',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteUserId(user.id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '13px',
                              fontWeight: 500,
                              backgroundColor: 'transparent',
                              color: 'var(--error)',
                              border: '1px solid var(--error)',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {deleteUserId && (
        <ConfirmModal
          isOpen={!!deleteUserId}
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone."
          onConfirm={() => deleteMutation.mutate(deleteUserId)}
          onCancel={() => setDeleteUserId(null)}
          confirmText="Delete"
          danger={true}
        />
      )}
    </>
  );
}
