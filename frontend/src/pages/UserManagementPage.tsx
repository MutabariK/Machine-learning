import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, TextField, MenuItem, Grid, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TablePagination,
  Alert, Switch, FormControlLabel, alpha,
} from '@mui/material';
import { Pencil, Search, Trash2, UserPlus } from 'lucide-react';
import { usersAPI, complaintsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User, Category } from '../types';
import { nairobiColors } from '../theme/nairobiTheme';

const MAX_DEPARTMENTS = 2;

const emptyCreateForm = {
  email: '', full_name: '', phone_number: '', password: '',
  role: 'citizen', departments: [] as number[],
};

const roleColors: Record<string, string> = {
  citizen: nairobiColors.green.main,
  official: nairobiColors.gold.dark,
  admin: nairobiColors.maroon.main,
};

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ role: '', departments: [] as number[], is_active: true });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      const params: Record<string, string | number> = { page: page + 1 };
      if (filters.role) params.role = filters.role;
      if (filters.search) params.search = filters.search;
      const res = await usersAPI.list(params);
      setUsers(res.data.results || res.data);
      setTotal(res.data.count || 0);
    } catch (err) {
      setError('Failed to load users.');
    }
  };

  useEffect(() => {
    complaintsAPI.getCategories().then(res => {
      setCategories(res.data.results || res.data);
    });
  }, []);

  useEffect(() => { loadUsers(); }, [page, filters]);

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role,
      departments: user.departments || [],
      is_active: user.is_active,
    });
    setEditOpen(true);
    setError('');
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setLoading(true);
    setError('');
    try {
      const data: Record<string, string | number[] | boolean> = {
        role: editForm.role,
        is_active: editForm.is_active,
      };
      if (editForm.role === 'official') {
        if (editForm.departments.length === 0) {
          setError('Please assign at least one department for this official.');
          setLoading(false);
          return;
        }
        data.departments = editForm.departments;
      } else {
        data.departments = [];
      }
      await usersAPI.update(selectedUser.id, data);
      setEditOpen(false);
      setMessage(`${selectedUser.full_name} updated successfully.`);
      loadUsers();
    } catch (err: any) {
      const detail = err.response?.data?.departments?.[0]
        || err.response?.data?.detail
        || 'Failed to update user.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCreateForm(emptyCreateForm);
    setCreateError('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    setCreateError('');
    try {
      if (createForm.role === 'official' && createForm.departments.length === 0) {
        setCreateError('Please assign at least one department for this official.');
        setCreateLoading(false);
        return;
      }
      await usersAPI.create({
        email: createForm.email,
        full_name: createForm.full_name,
        phone_number: createForm.phone_number,
        password: createForm.password,
        role: createForm.role,
        departments: createForm.role === 'official' ? createForm.departments : [],
      });
      setCreateOpen(false);
      setMessage(`${createForm.full_name} added successfully.`);
      loadUsers();
    } catch (err: any) {
      const detail = err.response?.data?.email?.[0]
        || err.response?.data?.departments?.[0]
        || err.response?.data?.password?.[0]
        || err.response?.data?.detail
        || 'Failed to create user.';
      setCreateError(detail);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await usersAPI.delete(deleteTarget.id);
      setDeleteTarget(null);
      setMessage(`${deleteTarget.full_name} was deleted.`);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete user.');
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: nairobiColors.green.dark }}>
        User Management
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Assign roles and departments to platform users
      </Typography>

      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth size="small" label="Search by name or email" value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{ endAdornment: <Search size={20} strokeWidth={1.75} style={{ opacity: 0.6 }} /> }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" label="Filter by Role" select value={filters.role}
              onChange={(e) => { setFilters({ ...filters, role: e.target.value }); setPage(0); }}>
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="citizen">Citizen</MenuItem>
              <MenuItem value="official">Official</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: { sm: 'flex-end' } }}>
            <Button variant="contained" startIcon={<UserPlus size={18} strokeWidth={1.75} />} onClick={handleOpenCreate}
              sx={{ bgcolor: nairobiColors.green.main, '&:hover': { bgcolor: nairobiColors.green.dark } }}>
              Add User
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Mobile: stacked cards -- same reasoning as ComplaintsPage: a 7-column
          table can't fit a phone width, and scrolling it with no visible
          affordance reads as broken rather than just cramped. */}
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        {users.map((u) => (
          <Paper key={u.id} sx={{ p: 2, mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700}>{u.full_name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{u.email}</Typography>
              </Box>
              <Chip
                label={u.role}
                size="small"
                sx={{
                  flexShrink: 0,
                  bgcolor: alpha(roleColors[u.role] || '#666', 0.12),
                  color: roleColors[u.role] || '#666',
                  fontWeight: 600,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
              <Chip
                label={u.is_active ? 'Active' : 'Inactive'} size="small"
                color={u.is_active ? 'success' : 'default'}
                variant={u.is_active ? 'filled' : 'outlined'}
              />
              <Typography variant="caption" color="text.secondary">{u.department_names || '—'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Joined {new Date(u.created_at).toLocaleDateString()}
              </Typography>
              <Box>
                <IconButton size="small" onClick={() => handleOpenEdit(u)} aria-label="Edit user">
                  <Pencil size={20} color={nairobiColors.gold.dark} strokeWidth={1.75} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setDeleteTarget(u)}
                  disabled={u.id === currentUser?.id}
                  aria-label="Delete user"
                >
                  <Trash2
                    size={20}
                    strokeWidth={1.75}
                    color={u.id === currentUser?.id ? undefined : nairobiColors.maroon.main}
                  />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        ))}
        {users.length === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No users found</Typography>
          </Paper>
        )}
        <Paper>
          <TablePagination
            component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)}
            rowsPerPage={20} rowsPerPageOptions={[20]}
          />
        </Paper>
      </Box>

      {/* Tablet/desktop: full table */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', sm: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>{u.full_name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip
                    label={u.role}
                    size="small"
                    sx={{
                      bgcolor: alpha(roleColors[u.role] || '#666', 0.12),
                      color: roleColors[u.role] || '#666',
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell>{u.department_names || '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={u.is_active ? 'Active' : 'Inactive'} size="small"
                    color={u.is_active ? 'success' : 'default'}
                    variant={u.is_active ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenEdit(u)} aria-label="Edit user">
                    <Pencil size={20} color={nairobiColors.gold.dark} strokeWidth={1.75} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteTarget(u)}
                    disabled={u.id === currentUser?.id}
                    aria-label="Delete user"
                  >
                    <Trash2
                      size={20}
                      strokeWidth={1.75}
                      color={u.id === currentUser?.id ? undefined : nairobiColors.maroon.main}
                    />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">No users found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)}
          rowsPerPage={20} rowsPerPageOptions={[20]}
        />
      </TableContainer>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${nairobiColors.green.dark} 0%, ${nairobiColors.green.main} 100%)`,
          color: 'white',
          borderBottom: `3px solid ${nairobiColors.gold.main}`,
        }}>
          Edit User — {selectedUser?.full_name}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField fullWidth margin="normal" label="Email" value={selectedUser?.email || ''} disabled />

          <TextField fullWidth margin="normal" label="Role" select value={editForm.role}
            onChange={(e) => setEditForm({ ...editForm, role: e.target.value, departments: e.target.value !== 'official' ? [] : editForm.departments })}>
            <MenuItem value="citizen">Citizen</MenuItem>
            <MenuItem value="official">County Official</MenuItem>
            <MenuItem value="admin">Administrator</MenuItem>
          </TextField>

          {editForm.role === 'official' && (
            <TextField
              fullWidth margin="normal" label="Departments" select
              SelectProps={{
                multiple: true,
                renderValue: (selected) => categories
                  .filter(c => (selected as number[]).includes(c.id))
                  .map(c => c.name)
                  .join(', '),
              }}
              value={editForm.departments}
              onChange={(e) => {
                const value = e.target.value as unknown as number[];
                if (value.length <= MAX_DEPARTMENTS) setEditForm({ ...editForm, departments: value });
              }}
              required
              helperText={`Assign this official to up to ${MAX_DEPARTMENTS} county departments`}>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          )}

          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Switch checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                color="primary" />
            }
            label="Account Active"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${nairobiColors.green.dark} 0%, ${nairobiColors.green.main} 100%)`,
          color: 'white',
          borderBottom: `3px solid ${nairobiColors.gold.main}`,
        }}>
          Add User
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}

          <TextField fullWidth margin="normal" label="Full Name" value={createForm.full_name}
            onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} />

          <TextField fullWidth margin="normal" label="Email" type="email" value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />

          <TextField fullWidth margin="normal" label="Phone Number" value={createForm.phone_number}
            onChange={(e) => setCreateForm({ ...createForm, phone_number: e.target.value })} />

          <TextField fullWidth margin="normal" label="Temporary Password" type="password"
            helperText="At least 8 characters. Share this with the user so they can log in and change it."
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />

          <TextField fullWidth margin="normal" label="Role" select value={createForm.role}
            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value, departments: e.target.value !== 'official' ? [] : createForm.departments })}>
            <MenuItem value="citizen">Citizen</MenuItem>
            <MenuItem value="official">County Official</MenuItem>
            <MenuItem value="admin">Administrator</MenuItem>
          </TextField>

          {createForm.role === 'official' && (
            <TextField
              fullWidth margin="normal" label="Departments" select
              SelectProps={{
                multiple: true,
                renderValue: (selected) => categories
                  .filter(c => (selected as number[]).includes(c.id))
                  .map(c => c.name)
                  .join(', '),
              }}
              value={createForm.departments}
              onChange={(e) => {
                const value = e.target.value as unknown as number[];
                if (value.length <= MAX_DEPARTMENTS) setCreateForm({ ...createForm, departments: value });
              }}
              required
              helperText={`Assign this official to up to ${MAX_DEPARTMENTS} county departments`}>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createLoading}>
            {createLoading ? 'Adding...' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.full_name}</strong> ({deleteTarget?.email})?
            This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPage;
