import {
  AVATAR_STYLES,
  DEFAULT_AVATAR_STYLE,
  generateAvatarSeed,
  resolveDicebearAvatarUrl,
} from '@jostle/profile-appearance';
import type { AvatarStyle } from '@jostle/profile-appearance';
import { Avatar, Button, Container, Input, Modal, Text, cn } from '@jostle/ui';
import { useEffect, useState } from 'react';

export interface AvatarCustomizerModalProps {
  open: boolean;
  onClose: () => void;
  currentSeed?: string;
  currentStyle?: AvatarStyle;
  name: string;
  initialsFontFamily?: string;
  onSave: (input: {
    avatarSeed: string;
    avatarStyle: AvatarStyle;
  }) => Promise<void>;
}

export function AvatarCustomizerModal({
  open,
  onClose,
  currentSeed,
  currentStyle,
  name,
  initialsFontFamily,
  onSave,
}: AvatarCustomizerModalProps) {
  const [seed, setSeed] = useState(currentSeed ?? generateAvatarSeed());
  const [style, setStyle] = useState<AvatarStyle>(
    currentStyle ?? DEFAULT_AVATAR_STYLE,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSeed(currentSeed ?? generateAvatarSeed());
      setStyle(currentStyle ?? DEFAULT_AVATAR_STYLE);
      setError(null);
    }
  }, [open, currentSeed, currentStyle]);

  const handleSave = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave({ avatarSeed: seed, avatarStyle: style });
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update Avatar"
      footer={
        <>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <Container direction="col" horizontalAlign="center" gap={4}>
        <Avatar
          imageUrl={resolveDicebearAvatarUrl(seed, style)}
          name={name}
          size="lg"
          initialsFontFamily={initialsFontFamily}
        />
        <Container direction="row" gap={2} className="w-full items-end">
          <Input
            label="Seed"
            value={seed}
            setValue={setSeed}
            color="primary"
            className="flex-1"
          />
          <Button
            variant="outlined"
            color="accent"
            onClick={() => setSeed(generateAvatarSeed())}
          >
            Shuffle
          </Button>
        </Container>

        <Container direction="col" gap={2} className="w-full">
          <Text
            fontSize="sm"
            fontWeight="medium"
            textColor="content-secondary"
            className="self-start"
          >
            Style
          </Text>
          <div className="grid w-full grid-cols-5 gap-2 sm:grid-cols-7">
            {AVATAR_STYLES.map((styleOption) => (
              <button
                key={styleOption}
                type="button"
                onClick={() => setStyle(styleOption)}
                aria-label={styleOption}
                aria-pressed={style === styleOption}
                title={styleOption}
                className={cn(
                  'cursor-pointer rounded-full transition-all',
                  style === styleOption
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-secondary'
                    : 'opacity-60 hover:opacity-100',
                )}
              >
                <Avatar
                  imageUrl={resolveDicebearAvatarUrl(seed, styleOption)}
                  name={styleOption}
                  size="sm"
                />
              </button>
            ))}
          </div>
        </Container>

        {error && (
          <Text fontSize="sm" className="text-red-400">
            {error}
          </Text>
        )}
      </Container>
    </Modal>
  );
}
