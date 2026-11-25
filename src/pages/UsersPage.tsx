import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { Users, RefreshCw, Search, ShieldCheck, User as UserIcon, ChevronDown, Mail } from 'lucide-react';

type UserRole = 'admin' | 'user';

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
}

interface UsersStats {
  totalUsers: number;
  adminUsers: number;
  standardUsers: number;
}

interface UsersApiResponse {
  success: boolean;
  users: UserRecord[];
  stats?: UsersStats;
}

function normalizeRole(role: unknown): UserRole {
  return String(role || '').toLowerCase().trim() === 'admin' ? 'admin' : 'user';
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<UsersStats>({
    totalUsers: 0,
    adminUsers: 0,
    standardUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch<UsersApiResponse>('/admin/users');
      const list: UserRecord[] = (res.users || []).map((u) => ({
        id: Number(u.id),
        name: String(u.name || 'Unnamed User'),
        email: String(u.email || ''),
        role: normalizeRole(u.role),
        avatar_url: u.avatar_url || null,
        created_at: u.created_at,
      }));

      setUsers(list);
      setStats({
        totalUsers: Number(res.stats?.totalUsers ?? list.length),
        adminUsers: Number(res.stats?.adminUsers ?? list.filter((u) => u.role === 'admin').length),
        standardUsers: Number(res.stats?.standardUsers ?? list.filter((u) => u.role === 'user').length),
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch<UsersApiResponse>('/admin/users');
        if (!mounted) return;

        const list: UserRecord[] = (res.users || []).map((u) => ({
          id: Number(u.id),
          name: String(u.name || 'Unnamed User'),
          email: String(u.email || ''),
          role: normalizeRole(u.role),
          avatar_url: u.avatar_url || null,
          created_at: u.created_at,
        }));

        setUsers(list);
        setStats({
          totalUsers: Number(res.stats?.totalUsers ?? list.length),
          adminUsers: Number(res.stats?.adminUsers ?? list.filter((u) => u.role === 'admin').length),
          standardUsers: Number(res.stats?.standardUsers ?? list.filter((u) => u.role === 'user').length),
        });
      } catch (err: unknown) {
        if (mounted) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load users');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [users, searchQuery, roleFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Users Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              View registered users and their assigned role (admin or user).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void loadUsers()}
            className="gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
            {errorMsg}
          </div>
        )}

        {/* 3 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All active user records</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Admins</CardTitle>
              <ShieldCheck className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {stats.adminUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Role set to admin</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs uppercase font-medium text-muted-foreground">Standard Users</CardTitle>
              <UserIcon className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {stats.standardUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Default role set to user</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table Card */}
        <Card className="border-border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Registered Users</CardTitle>
              <CardDescription className="text-xs">
                Showing {filteredUsers.length} of {users.length} users
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-8 text-xs"
                />
              </div>

              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as 'ALL' | UserRole)}
                  className="w-full sm:w-36 h-9 appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">All Roles</option>
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 sm:p-6">
            {loading && users.length === 0 ? (
              <div className="flex h-48 items-center justify-center">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                No users match your current search or role filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[650px]">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                      <th className="pb-3 px-4 sm:px-0 font-medium">User</th>
                      <th className="pb-3 px-2 font-medium">Email</th>
                      <th className="pb-3 px-2 font-medium">Role</th>
                      <th className="pb-3 px-4 sm:px-0 font-medium text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 px-4 sm:px-0 font-medium">
                          <div className="font-semibold text-sm text-foreground">{u.name}</div>
                          <div className="text-[11px] text-muted-foreground">ID #{u.id}</div>
                        </td>
                        <td className="py-3.5 px-2 text-xs">
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span>{u.email || '—'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              u.role === 'admin'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-0 text-right text-xs text-muted-foreground">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}