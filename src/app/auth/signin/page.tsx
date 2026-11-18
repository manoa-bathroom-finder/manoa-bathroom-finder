'use client';

import { signIn } from 'next-auth/react'; // v5 compatible
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

/** The sign in page. */
const SignIn = () => {
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      email: { value: string };
      password: { value: string };
    };
    const email = target.email.value;
    const password = target.password.value;
    await signIn('credentials', {
      callbackUrl: '/list',
      email,
      password,
    });
  };

  return (
    <main>
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs={12} sm={9} md={7} lg={5}>
            <h1 className="text-center">Sign In</h1>
            <Card>
              <Card.Body>
                <Form method="post" onSubmit={handleSubmit}>
                  <Form.Group controlId="formBasicEmail">
                    <Form.Label>Email</Form.Label>
                    <input name="email" type="email" autoComplete="email" required className="form-control" />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Password</Form.Label>
                    <input name="password" type="password" autoComplete="current-password" required className="form-control" />
                  </Form.Group>
                  <Button type="submit" variant="success" className="mt-3">
                    Sign in
                  </Button>
                </Form>
              </Card.Body>
              <Card.Footer>
                Don&apos;t have an account?{' '}
                <a href="/auth/signup">Sign up</a>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </main>
  );
};

export default SignIn;
