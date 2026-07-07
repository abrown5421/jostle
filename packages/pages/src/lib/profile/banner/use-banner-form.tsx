import {
  useUpdateUserMutation,
  useCreateAssetIntentMutation,
  useUploadAssetBinaryMutation,
  setActiveUser,
} from '@inithium/store';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { BannerMode, BannerState, clampCellSize, clampVariance, extractBannerProps } from './banner-utils';
import { buildProxyUrl, UploadStatus } from '../avatar/avatar-utils';

interface UseBannerFormOptions {
  profileUser: any;
  activeUser: any;
}

export const useBannerForm = ({ profileUser, activeUser }: UseBannerFormOptions) => {
  const dispatch = useDispatch();
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const [createAssetIntent] = useCreateAssetIntentMutation();
  const [uploadAssetBinary] = useUploadAssetBinaryMutation();

  const buildInitialState = (): BannerState => {
    const extracted = extractBannerProps(profileUser);
    return {
      mode: extracted.mode,
      src: extracted.src ?? '',
      variance: extracted.variance,
      cellSize: extracted.cellSize,
      xColors: extracted.xColors,
      yColors: extracted.yColors,
    };
  };

  const [formState, setFormState] = useState<BannerState>(buildInitialState);
  const [modeOverride, setModeOverride] = useState<BannerMode | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profileUser?.user_banner !== undefined) {
      const extracted = extractBannerProps(profileUser);
      setFormState({
        mode: modeOverride ?? extracted.mode,
        src: extracted.src ?? '',
        variance: extracted.variance,
        cellSize: extracted.cellSize,
        xColors: extracted.xColors,
        yColors: extracted.yColors,
      });
    }
  }, [profileUser]);

  useEffect(() => {
    if (!pendingFile) { setLocalPreviewUrl(null); return; }
    const url = URL.createObjectURL(pendingFile);
    setLocalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const handleUpdateMode = (mode: BannerMode) => () => {
    setModeOverride(mode);
    setFormState((prev) => ({ ...prev, mode }));
    if (mode !== 'image') {
      setPendingFile(null);
      setUploadStatus('idle');
      setUploadError(null);
    }
  };

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

  const handleVarianceChange = (value: number) =>
    setFormState((prev) => ({ ...prev, variance: clampVariance(value) }));

  const handleCellSizeChange = (value: number) =>
    setFormState((prev) => ({ ...prev, cellSize: clampCellSize(value) }));

  const handleXColorChange = (index: number) => (newColor: string) =>
    setFormState((prev) => {
      const updated = [...prev.xColors];
      updated[index] = newColor;
      return { ...prev, xColors: updated };
    });

  const handleYColorChange = (index: number) => (newColor: string) =>
    setFormState((prev) => {
      const updated = [...prev.yColors];
      updated[index] = newColor;
      return { ...prev, yColors: updated };
    });

  const handleAddXColor = () =>
    setFormState((prev) => ({ ...prev, xColors: [...prev.xColors, '#ffffff'] }));

  const handleAddYColor = () =>
    setFormState((prev) => ({ ...prev, yColors: [...prev.yColors, '#ffffff'] }));

  const handleRemoveXColor = (index: number) =>
    setFormState((prev) => {
      if (prev.xColors.length <= 1) return prev;
      return { ...prev, xColors: prev.xColors.filter((_, i) => i !== index) };
    });

  const handleRemoveYColor = (index: number) =>
    setFormState((prev) => {
      if (prev.yColors.length <= 1) return prev;
      return { ...prev, yColors: prev.yColors.filter((_, i) => i !== index) };
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

  const handleSave = async (closeDialog: () => void) => {
    if (!profileUser?._id) return;
    setSaveError(null);
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
          user_banner: {
            ...profileUser.user_banner,
            src: resolvedSrc || undefined,
            variance: formState.mode === 'trianglify' ? formState.variance : undefined,
            cell_size: formState.mode === 'trianglify' ? formState.cellSize : undefined,
            x_colors: formState.mode === 'trianglify' ? formState.xColors : undefined,
            y_colors: formState.mode === 'trianglify' ? formState.yColors : undefined,
          },
        },
      }).unwrap();

      if (activeUser && activeUser._id === updatedUserResult._id) {
        dispatch(setActiveUser(updatedUserResult));
      }

      setPendingFile(null);
      setUploadStatus('idle');
      setModeOverride(null);
      closeDialog();
    } catch (err: any) {
      setUploadStatus('error');
      const message = err?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.';
      setSaveError(message);
      setUploadError(message);
    }
  };

  const resetFormState = () => {
    setSaveError(null);
    setUploadError(null);
    setPendingFile(null);
    setUploadStatus('idle');
    setModeOverride(null);
    const extracted = extractBannerProps(profileUser);
    setFormState({
      mode: extracted.mode,
      src: extracted.src ?? '',
      variance: extracted.variance,
      cellSize: extracted.cellSize,
      xColors: extracted.xColors,
      yColors: extracted.yColors,
    });
  };

  const isBusy = isSaving || uploadStatus === 'requesting-intent' || uploadStatus === 'uploading';

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
    saveError,
    previewSrc,
    fileInputRef,
    handleUpdateMode,
    handleUrlInputChange,
    handleFileSelect,
    handleRemovePendingFile,
    handleVarianceChange,
    handleCellSizeChange,
    handleXColorChange,
    handleYColorChange,
    handleAddXColor,
    handleAddYColor,
    handleRemoveXColor,
    handleRemoveYColor,
    handleSave,
    resetFormState,
  };
};