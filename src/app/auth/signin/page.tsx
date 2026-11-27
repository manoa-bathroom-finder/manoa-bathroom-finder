'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

type AuthBannerType = 'suspended' | 'invalid' | null;

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlError = searchParams.get('error');
  const urlCode = searchParams.get('code');

  const initialBanner: AuthBannerType =
    urlCode === 'suspended'
      ? 'suspended'
      : urlError
        ? 'invalid'
        : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [banner, setBanner] = useState<AuthBannerType>(initialBanner);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setBanner(null);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    setSubmitting(false);

    if (res?.error) {
      if (res.code === 'suspended') {
        setBanner('suspended');
      } else {
        setBanner('invalid');
      }
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <h1 className="h4 fw-bold text-center mb-4">Sign In</h1>

              {banner === 'suspended' && (
                <Alert variant="warning" dismissible onClose={() => setBanner(null)}>
                  <i className="fa-solid fa-triangle-exclamation me-2" />
                  <strong>Account Suspended:</strong> Your account has been suspended. Please
                  email <a href="mailto:admin@foo.com" className="alert-link">admin@foo.com</a> for
                  assistance.
                </Alert>
              )}

              {banner === 'invalid' && (
                <Alert variant="danger" dismissible onClose={() => setBanner(null)}>
                  <i className="fa-solid fa-circle-exclamation me-2" />
                  <strong>Sign-In Failed:</strong> Incorrect email or password. Please try again.
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="signin-email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="john@foo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="signin-password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>
              </Form>
            </Card.Body>

            <Card.Footer className="bg-light text-center py-3">
              Don&apos;t have an account? <Link href="/auth/signup">Sign up</Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<Container className="py-5 text-center text-muted">Loading...</Container>}>
      <SignInForm />
    </Suspense>
  );
}