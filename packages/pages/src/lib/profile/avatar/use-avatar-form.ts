import {
  useCreateAssetIntentMutation,
  useUpdateUserMutation,
  useUploadAssetBinaryMutation,
  setActiveUser,
} from '@inithium/store';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  AvatarMode,
  AvatarShape,
  AvatarState,
  UploadStatus,
  buildProxyUrl,
  compileGradient,
  extractAvatarProps,
  parseInitialColors,
} from './avatar-utils';

interface UseAvatarFormOptions {
  profileUser: any;
  activeUser: any;
}

export const useAvatarForm = ({ profileUser, activeUser }: UseAvatarFormOptions) => {
  const dispatch = useDispatch();
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const [createAssetIntent] = useCreateAssetIntentMutation();
  const [uploadAssetBinary] = useUploadAssetBinaryMutation();

  const [formState, setFormState] = useState<AvatarState>({
    mode: 'gradient',
    shape: 'circle',
    src: '',
    colors: ['#E86200, #e2e8f0'],
    fontColor: '#ffffff',
  });
  
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profileUser?.user_avatar) {
      const currentAvatar = extractAvatarProps(profileUser);
      setFormState({
        mode: currentAvatar.src ? 'image' : 'gradient',
        shape: currentAvatar.shape,
        src: currentAvatar.src || '',
        colors: parseInitialColors(currentAvatar.background),
        fontColor: currentAvatar.fontColor ?? '#ffffff',
      });
    }
  }, [profileUser]);

  useEffect(() => {
    if (!pendingFile) { setLocalPreviewUrl(null); return; }
    const url = URL.createObjectURL(pendingFile);
    setLocalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const handleUpdateMode = (mode: AvatarMode) => () => {
    setFormState((prev) => ({ ...prev, mode }));
    if (mode !== 'image') {
      setPendingFile(null);
      setUploadStatus('idle');
      setUploadError(null);
    }
  };

  const handleUpdateShape = (shape: AvatarShape) => () =>
    setFormState((prev) => ({ ...prev, shape }));

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingFile(null);
    setUploadStatus('idle');
    setUploadError(null);
    setFormState((prev) => ({ ...prev, src: e.target.value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormState((prev) => ({ ...prev, src: '' }));
    setPendingFile(file);
    setUploadStatus('idle');
    setUploadError(null);
  };

  const handleRemovePendingFile = () => {
    setPendingFile(null);
    setUploadStatus('idle');
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleColorChange = (index: number) => (newColor: string) => {
    setFormState((prev) => {
      const updatedColors = [...prev.colors];
      updatedColors[index] = newColor;
      return { ...prev, colors: updatedColors };
    });
  };

  const handleAddColor = () =>
    setFormState((prev) => ({ ...prev, colors: [...prev.colors, '#ffffff'] }));

  const handleRemoveColor = (index: number) =>
    setFormState((prev) => {
      if (prev.colors.length <= 1) return prev;
      return { ...prev, colors: prev.colors.filter((_, i) => i !== index) };
    });

  const uploadPendingFile = async (file: File): Promise<string> => {
    setUploadStatus('requesting-intent');

    const intentResult = await createAssetIntent({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      ownerType: 'user',
      ownerId: activeUser?._id ?? null,
    } as any).unwrap();

    setUploadStatus('uploading');

    const uploadResult = await uploadAssetBinary({
      uploadUrl: intentResult.uploadUrl,
      file,
    }).unwrap();

    setUploadStatus('done');
    return buildProxyUrl(uploadResult.asset_id);
  };
  
  const handleFontColorChange = (newColor: string) =>
    setFormState((prev) => ({ ...prev, fontColor: newColor }));
  
  const handleSave = async (closeDialog: () => void) => {
    if (!profileUser?._id) return;
    setUploadError(null);

    try {
      let resolvedSrc = formState.mode === 'image' ? formState.src : '';

      if (formState.mode === 'image' && pendingFile) {
        resolvedSrc = await uploadPendingFile(pendingFile);
        setFormState((prev) => ({ ...prev, src: resolvedSrc }));
      }

      const updatedUserResult = await updateUser({
        id: profileUser._id,
        data: {
          user_avatar: {
            ...profileUser.user_avatar,
            shape: formState.shape,
            src: resolvedSrc,
            background:
              formState.mode === 'gradient' ? compileGradient(formState.colors) : undefined,
            fontColor: formState.fontColor,
          },
        },
      }).unwrap();

      if (activeUser && activeUser._id === updatedUserResult._id) {
        dispatch(setActiveUser(updatedUserResult));
      }

      setPendingFile(null);
      setUploadStatus('idle');
      closeDialog();
    } catch (err: any) {
      setUploadStatus('error');
      setUploadError(
        err?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.',
      );
    }
  };

  const resetUploadState = () => {
    setPendingFile(null);
    setUploadStatus('idle');
    setUploadError(null);
  };

  const isBusy =
    isSaving || uploadStatus === 'requesting-intent' || uploadStatus === 'uploading';

  const previewSrc =
    formState.mode === 'image'
      ? localPreviewUrl ?? (formState.src || undefined)
      : undefined;

  return {
    formState,
    pendingFile,
    uploadStatus,
    uploadError,
    isBusy,
    previewSrc,
    previewBackground: compileGradient(formState.colors ?? []),
    fileInputRef,
    handleUpdateMode,
    handleUpdateShape,
    handleUrlInputChange,
    handleFileSelect,
    handleRemovePendingFile,
    handleColorChange,
    handleAddColor,
    handleFontColorChange,
    handleRemoveColor,
    handleSave,
    resetUploadState,
  };
};