import { Button, Container, Text } from '@jostle/ui';

export type ConnectionFeedbackStatus = 'connected' | 'error';

export interface ConnectionFeedbackBannerProps {
  readonly status: ConnectionFeedbackStatus | null;
  readonly providerDisplayName?: string;
  readonly reason?: string | null;
  readonly onDismiss: () => void;
}

export function ConnectionFeedbackBanner({
  status,
  providerDisplayName,
  reason,
  onDismiss,
}: ConnectionFeedbackBannerProps) {
  if (!status) return null;

  const name = providerDisplayName ?? 'That account';
  const message =
    status === 'connected'
      ? `${name} connected successfully.`
      : `Something went wrong connecting ${name}${reason ? ` (${reason})` : ''}.`;

  return (
    <Container
      direction="row"
      horizontalAlign="between"
      verticalAlign="center"
      gap={3}
      padding={3}
      backgroundColor="surface-secondary"
      borderColor="surface-tertiary"
      className="w-full rounded-lg border"
    >
      <Text textColor="content-primary">{message}</Text>
      <Button variant="link" onClick={onDismiss}>
        Dismiss
      </Button>
    </Container>
  );
}
