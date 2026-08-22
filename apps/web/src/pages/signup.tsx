import { Container, Text } from '@jostle/ui';
import { Link } from 'react-router';

export function SignupPage() {
  return (
    <Container direction="col" gap={4} padding={8}>
      <Text fontSize="3xl" fontWeight="bold" textColor="content-primary">
        Sign up
      </Text>
      <Container gap={4}>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
      </Container>
    </Container>
  );
}
