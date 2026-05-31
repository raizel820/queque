'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useAppStore } from '@/store/use-app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Edit3,
  Loader2,
  Shield,
  Copy,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  role: string;
  joinedAt: string;
  isActive: boolean;
  user: {
    username: string;
    fullName: string;
    role: string;
    isActive: boolean;
  };
}

export function SettingsStaff() {
  const { user } = useAppStore();
  const { t, lang } = useLanguage();

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [addStaffLoading, setAddStaffLoading] = useState(false);

  // Create staff form state
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffFullName, setNewStaffFullName] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'STAFF' | 'MANAGER'>('STAFF');

  // Staff credentials dialog state
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);

  // Edit staff state
  const [editStaffOpen, setEditStaffOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editRole, setEditRole] = useState<'STAFF' | 'MANAGER'>('STAFF');
  const [editStaffLoading, setEditStaffLoading] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    if (!user?.agencyId) return;
    setStaffLoading(true);
    try {
      const res = await fetch(`/api/agency/staff?agencyId=${user.agencyId}`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff ?? []);
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setStaffLoading(false);
    }
  };

  const resetStaffForm = () => {
    setNewStaffUsername('');
    setNewStaffFullName('');
    setNewStaffPassword('');
    setNewStaffRole('STAFF');
  };

  const openEditStaffDialog = (staff: {
    id: string;
    role: string;
    user: { fullName: string; isActive: boolean };
  }) => {
    setEditingStaffId(staff.id);
    setEditFullName(staff.user.fullName);
    setEditIsActive(staff.user.isActive);
    setEditRole(staff.role === 'MANAGER' ? 'MANAGER' : 'STAFF');
    setEditStaffOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaffId || !editFullName.trim()) return;
    setEditStaffLoading(true);
    try {
      const res = await fetch(`/api/agency/staff/${editingStaffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          isActive: editIsActive,
          role: editRole,
        }),
      });
      if (res.ok) {
        toast.success(t('success'));
        setEditStaffOpen(false);
        setEditingStaffId(null);
        fetchStaff();
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setEditStaffLoading(false);
    }
  };

  const handleToggleStaffActive = async (
    staffId: string,
    currentActive: boolean
  ) => {
    try {
      const res = await fetch(`/api/agency/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        toast.success(t('success'));
        fetchStaff();
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    }
  };

  const handleCreateStaff = async () => {
    if (
      !newStaffUsername.trim() ||
      !newStaffFullName.trim() ||
      !newStaffPassword ||
      !user?.agencyId
    )
      return;
    setAddStaffLoading(true);
    try {
      const res = await fetch('/api/agency/staff/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId: user.agencyId,
          username: newStaffUsername.trim(),
          fullName: newStaffFullName.trim(),
          password: newStaffPassword,
          staffRole: newStaffRole,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedCredentials({
          username: data.staff.user.username,
          password: data.initialPassword,
        });
        setCredentialsCopied(false);
        setCredentialsDialogOpen(true);
        toast.success(t('success'));
        resetStaffForm();
        setAddStaffOpen(false);
        fetchStaff();
      } else {
        const data = await res.json();
        if (res.status === 409) {
          toast.error(t('usernameTaken'));
        } else {
          toast.error(data.error || t('error'));
        }
      }
    } catch {
      toast.error(t('error'));
    } finally {
      setAddStaffLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!user?.agencyId) return;
    try {
      const res = await fetch(`/api/agency/staff/${staffId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(t('staffRemoved'));
        fetchStaff();
      } else {
        const data = await res.json();
        toast.error(data.error || t('error'));
      }
    } catch {
      toast.error(t('error'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          {t('staffList')}
        </Label>
        <Dialog
          open={addStaffOpen}
          onOpenChange={(open) => {
            setAddStaffOpen(open);
            if (!open) resetStaffForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5 me-1" />
              {t('createStaffAccount')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('createStaffAccount')}</DialogTitle>
              <DialogDescription className="sr-only">
                {t('createStaffAccount')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{t('staffUsername')}</Label>
                <Input
                  value={newStaffUsername}
                  onChange={(e) => setNewStaffUsername(e.target.value)}
                  placeholder={t('enterUsername')}
                  className="h-11"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('staffFullName')}</Label>
                <Input
                  value={newStaffFullName}
                  onChange={(e) => setNewStaffFullName(e.target.value)}
                  placeholder={t('staffFullName')}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('staffInitialPassword')}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    onClick={() => {
                      const chars =
                        'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
                      let pwd = '';
                      for (let i = 0; i < 8; i++) {
                        pwd += chars.charAt(
                          Math.floor(Math.random() * chars.length)
                        );
                      }
                      setNewStaffPassword(pwd);
                    }}
                  >
                    <RefreshCw className="h-3 w-3 me-1" />
                    {t('generatePassword')}
                  </Button>
                </div>
                <Input
                  type="text"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  placeholder={t('passwordMinLength')}
                  className="h-11"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('staffRoleSelect')}</Label>
                <Select
                  value={newStaffRole}
                  onValueChange={(v) =>
                    setNewStaffRole(v as 'STAFF' | 'MANAGER')
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">{t('staffRoleStaff')}</SelectItem>
                    <SelectItem value="MANAGER">
                      {t('staffRoleManager')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddStaffOpen(false);
                  resetStaffForm();
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleCreateStaff}
                disabled={
                  addStaffLoading ||
                  !newStaffUsername.trim() ||
                  !newStaffFullName.trim() ||
                  !newStaffPassword
                }
              >
                {addStaffLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin me-1" />
                ) : null}
                {t('submit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {staffLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : staffList.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('noData')}
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {staffList.map((staff) => {
            const isOwner = staff.role === 'OWNER';
            const isUserActive = staff.user.isActive;
            return (
              <motion.div
                key={staff.id}
                initial={{ opacity: 0.95 }}
                animate={{ opacity: 1 }}
                className={`flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800/50 ${
                  !isUserActive
                    ? 'bg-gray-50/50 dark:bg-gray-900/30 opacity-70'
                    : 'bg-gray-50 dark:bg-gray-900/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isOwner
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : staff.role === 'MANAGER'
                          ? 'bg-purple-100 dark:bg-purple-900/30'
                          : 'bg-emerald-100 dark:bg-emerald-900/30'
                    }`}
                  >
                    <Shield
                      className={`h-4.5 w-4.5 ${
                        isOwner
                          ? 'text-amber-700 dark:text-amber-400'
                          : staff.role === 'MANAGER'
                            ? 'text-purple-700 dark:text-purple-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {staff.user.fullName}
                      </p>
                      {isOwner && (
                        <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {t('ownerRole')}
                        </span>
                      )}
                      {!isOwner && staff.role === 'MANAGER' && (
                        <span className="text-[9px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {t('staffRoleManager')}
                        </span>
                      )}
                      {!isOwner && staff.role === 'STAFF' && (
                        <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {t('staffRoleStaff')}
                        </span>
                      )}
                      {!isUserActive && (
                        <span className="text-[9px] font-bold bg-gray-200 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {t('inactive')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      @{staff.user.username}
                    </p>
                    {staff.user.role === 'AGENCY_STAFF' && !isOwner && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {t('initialAccountCreated')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground hidden sm:inline me-1">
                    {new Date(staff.joinedAt).toLocaleDateString(
                      lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-US'
                    )}
                  </span>
                  {/* Active/Inactive toggle */}
                  {!isOwner && (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isUserActive}
                      aria-label={isUserActive ? t('active') : t('inactive')}
                      onClick={() =>
                        handleToggleStaffActive(staff.id, isUserActive)
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900 cursor-pointer ${
                        isUserActive
                          ? 'bg-emerald-500 shadow-inner shadow-emerald-600/30'
                          : 'bg-gray-300 dark:bg-gray-600 shadow-inner shadow-gray-400/30'
                      }`}
                    >
                      <span
                        className={`pointer-events-none absolute top-[2px] h-5 w-5 rounded-full shadow-md bg-white transition-all duration-300 ease-in-out ${
                          isUserActive ? 'start-[22px]' : 'start-[2px]'
                        }`}
                      />
                    </button>
                  )}
                  {/* Edit button */}
                  {!isOwner && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditStaffDialog(staff)}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {/* Delete button */}
                  {!isOwner && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                      onClick={() => handleRemoveStaff(staff.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Staff Credentials Success Dialog */}
      <Dialog
        open={credentialsDialogOpen}
        onOpenChange={(open) => {
          setCredentialsDialogOpen(open);
          if (!open) setCreatedCredentials(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              {t('staffAccountCreated')}
            </DialogTitle>
            <DialogDescription>{t('credentialsShareHint')}</DialogDescription>
          </DialogHeader>
          {createdCredentials && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t('username')}
                      </p>
                      <p
                        className="text-sm font-semibold text-foreground"
                        dir="ltr"
                      >
                        {createdCredentials.username}
                      </p>
                    </div>
                  </div>
                  <div className="h-px bg-emerald-200 dark:bg-emerald-800/30" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t('password')}
                      </p>
                      <p
                        className="text-sm font-semibold text-foreground"
                        dir="ltr"
                      >
                        {createdCredentials.password}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={async () => {
                    const text = `${t('username')}: ${createdCredentials.username}\n${t('password')}: ${createdCredentials.password}`;
                    try {
                      await navigator.clipboard.writeText(text);
                      setCredentialsCopied(true);
                      toast.success(t('credentialsCopied'));
                      setTimeout(() => setCredentialsCopied(false), 2000);
                    } catch {
                      toast.error(t('error'));
                    }
                  }}
                >
                  {credentialsCopied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 me-1" />
                      {t('copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 me-1" />
                      {t('copyCredentials')}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                {t('credentialsWarning')}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog
        open={editStaffOpen}
        onOpenChange={(open) => {
          setEditStaffOpen(open);
          if (!open) setEditingStaffId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('editStaffMember')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('editStaffMember')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('staffFullName')}</Label>
              <Input
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder={t('staffFullName')}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('staffRoleSelect')}</Label>
              <Select
                value={editRole}
                onValueChange={(v) => setEditRole(v as 'STAFF' | 'MANAGER')}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">{t('staffRoleStaff')}</SelectItem>
                  <SelectItem value="MANAGER">
                    {t('staffRoleManager')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {t('status')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editIsActive ? t('active') : t('inactive')}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={editIsActive}
                onClick={() => setEditIsActive(!editIsActive)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 dark:focus:ring-offset-gray-900 cursor-pointer ${
                  editIsActive
                    ? 'bg-emerald-500 shadow-inner shadow-emerald-600/30'
                    : 'bg-gray-300 dark:bg-gray-600 shadow-inner shadow-gray-400/30'
                }`}
              >
                <span
                  className={`pointer-events-none absolute top-[3px] h-5 w-5 rounded-full shadow-md bg-white transition-all duration-300 ease-in-out ${
                    editIsActive ? 'start-[25px]' : 'start-[3px]'
                  }`}
                />
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditStaffOpen(false);
                setEditingStaffId(null);
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleUpdateStaff}
              disabled={editStaffLoading || !editFullName.trim()}
            >
              {editStaffLoading ? (
                <Loader2 className="h-4 w-4 animate-spin me-1" />
              ) : null}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
