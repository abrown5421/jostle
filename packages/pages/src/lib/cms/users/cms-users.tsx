import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Dialog, Pagination, Text } from '@inithium/ui';
import {
  useReadAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useDeleteUsersBatchMutation,
  selectActiveUser,
  showAlert,
} from '@inithium/store';
import { User } from '@inithium/types';
import { UserItem } from './user-item';
import { UserForm } from './user-form';
import { CmsDataPage } from '@inithium/ui';
import { ConfirmDeleteDialog } from '@inithium/ui';

const PAGE_SIZE = 8;

const filterUsers =
  (query: string) =>
  (users: readonly User[]): readonly User[] => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  };

const toggleSelection =
  (id: string) =>
  (selected: ReadonlySet<string>): ReadonlySet<string> => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

const toggleAll =
  (pageIds: readonly string[]) =>
  (selected: ReadonlySet<string>): ReadonlySet<string> => {
    const hasAll = pageIds.every((id) => selected.has(id));
    const next = new Set(selected);
    pageIds.forEach((id) => (hasAll ? next.delete(id) : next.add(id)));
    return next;
  };

const CmsUsersPage: React.FC = () => {
  const dispatch = useDispatch();
  const loggedInUser = useSelector(selectActiveUser);
  const loggedInRole = loggedInUser?.role ?? 'user';

  const canCreateUsers = loggedInRole === 'super-admin' || loggedInRole === 'admin';
  const canDeleteUsers =
    loggedInRole === 'super-admin' ||
    loggedInRole === 'admin' ||
    loggedInRole === 'editor';

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<User | undefined>(undefined);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteContext, setDeleteContext] = useState<{
    targets: readonly string[];
    label: string;
  } | null>(null);

  const { data, isLoading, error } = useReadAllUsersQuery({ page: currentPage, limit: PAGE_SIZE });
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [deleteUsersBatch] = useDeleteUsersBatchMutation();

  const users: readonly User[] = useMemo(() => data?.data ?? [], [data]);
  const totalItems = data?.meta.total ?? 0;

  const filteredUsers = useMemo(() => filterUsers(searchQuery)(users), [searchQuery, users]);

  const pageIds = useMemo(() => filteredUsers.map((u) => u._id), [filteredUsers]);

  const isAllSelected = useMemo(
    () => pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id)),
    [pageIds, selectedIds],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleToggle = (id: string): void => setSelectedIds(toggleSelection(id));
  const handleToggleAll = (): void => setSelectedIds(toggleAll(pageIds));

  const handleCreateTrigger = (): void => {
    if (!canCreateUsers) return;
    setApiError(null);
    setActiveUser(undefined);
    setIsFormOpen(true);
  };

  const handleEditTrigger = (user: User): void => {
    setApiError(null);
    setActiveUser(user);
    setIsFormOpen(true);
  };

  const handleFormClose = (): void => {
    setIsFormOpen(false);
    setActiveUser(undefined);
    setApiError(null);
  };

  const handleFormSubmit = async (payload: any): Promise<void> => {
    setFormSubmitting(true);
    setApiError(null);
    try {
      if (activeUser) {
        await updateUser({ id: activeUser._id, data: payload }).unwrap();
      } else {
        await createUser(payload).unwrap();
      }
      setIsFormOpen(false);
      setActiveUser(undefined);
      dispatch(
        showAlert({
          message: activeUser
            ? 'Account profiles saved successfully.'
            : 'New management operator created successfully.',
          severity: 'success',
          closeable: false,
          position: 'bottom-right',
          animation_object: {
            entry: 'fadeInRight',
            exit: 'fadeOutRight',
            entrySpeed: 'fast',
            exitSpeed: 'faster',
          },
        }),
      );
    } catch (err: any) {
      const msg =
        err?.data?.message ?? err?.error ?? 'An unexpected validation rejection occurred.';
      setApiError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      console.error('Operation failure caught during storage update:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteTrigger = (user: User): void => {
    if (!canDeleteUsers) return;
    setDeleteContext({
      targets: [user._id],
      label: `Are you sure you want to permanently remove ${user.first_name} ${user.last_name}? This action cannot be undone.`,
    });
  };

  const handleBulkDeleteTrigger = (): void => {
    if (!canDeleteUsers) return;
    const total = selectedIds.size;
    setDeleteContext({
      targets: Array.from(selectedIds),
      label: `Are you sure you want to permanently remove ${total} selected users? All access credentials and associations will be deleted.`,
    });
  };

  const executeDeletion = async (closeDialog: () => void): Promise<void> => {
    if (!deleteContext) return;
    try {
      const { targets } = deleteContext;
      if (targets.length === 1) {
        await deleteUser(targets[0]).unwrap();
        if (selectedIds.has(targets[0])) {
          setSelectedIds(toggleSelection(targets[0]));
        }
      } else {
        await deleteUsersBatch(targets).unwrap();
        setSelectedIds(new Set());
      }
      closeDialog();
    } catch (err) {
      console.error('Destructive pipeline error:', err);
    } finally {
      setDeleteContext(null);
    }
  };

  return (
    <>
      <CmsDataPage
        isLoading={isLoading}
        error={error}
        errorMessage="Error loading resources"
        searchQuery={searchQuery}
        searchLabel="Search by name or email"
        onSearchChange={handleSearchChange}
        toolbarAction={
          canCreateUsers ? (
            <Button
              variant="solid"
              color="primary"
              size="sm"
              onClick={handleCreateTrigger}
              leadingIcon="user-plus"
            >
              Add User
            </Button>
          ) : undefined
        }
        isAllSelected={isAllSelected}
        onToggleAll={handleToggleAll}
        selectedCount={selectedIds.size}
        canBulkDelete={canDeleteUsers}
        onBulkDelete={handleBulkDeleteTrigger}
        pagination={
          <Pagination
            totalItems={totalItems}
            itemsPerPage={PAGE_SIZE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        }
      >
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user: User) => (
            <UserItem
              key={user._id}
              user={user}
              isSelected={selectedIds.has(user._id)}
              onToggle={handleToggle}
              onEdit={handleEditTrigger}
              onDelete={handleDeleteTrigger}
              loggedInRole={loggedInRole}
            />
          ))
        ) : (
          <Box flex justify="center" align="center" className="py-8">
            <Text color="secondary">No users match &ldquo;{searchQuery}&rdquo;</Text>
          </Box>
        )}
      </CmsDataPage>

      <Dialog
        open={isFormOpen}
        onClose={handleFormClose}
        title={
          activeUser
            ? `Modify Account: ${activeUser.first_name}`
            : 'Register New Manager Account'
        }
        size="xl"
        variant="default"
        backdrop={true}
        transition={true}
        closeOnBackdropClick={!formSubmitting}
        showCloseButton={!formSubmitting}
      >
        <UserForm
          user={activeUser}
          isSubmitting={formSubmitting}
          error={apiError}
          onSubmit={handleFormSubmit}
          onCancel={handleFormClose}
          loggedInRole={loggedInRole}
        />
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteContext)}
        label={deleteContext?.label ?? ''}
        onClose={() => setDeleteContext(null)}
        onConfirm={executeDeletion}
      />
    </>
  );
};

export default CmsUsersPage;