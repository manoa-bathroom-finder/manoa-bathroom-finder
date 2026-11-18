'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Badge, Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import {
  BoxArrowRight,
  Lock,
  PersonFill,
  PersonPlusFill,
} from 'react-bootstrap-icons';

interface NavBarProps {
  favoriteCount?: number;
  pendingCount?: number;
}

const NavBar = ({ favoriteCount = 2, pendingCount = 2 }: NavBarProps) => {
  const { data: session } = useSession();
  const currentUser = session?.user?.email;
  const userWithRole = session?.user as { email: string; randomKey: string };
  const role = userWithRole?.randomKey;
  const pathName = usePathname();

  return (
    <Navbar bg="white" expand="lg" sticky="top" className="border-bottom shadow-sm py-2">
      <Container>
        {/* BRANDING LOGO */}
        <Navbar.Brand href="/" className="d-flex align-items-center gap-2 text-decoration-none">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm"
            style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
            }}
          >
            <i className="fa-solid fa-restroom fs-5" />
          </div>
          <div className="lh-1">
            <div className="d-flex align-items-center gap-1">
              <span className="fw-bolder fs-5 text-dark">
                manoa<span style={{ color: '#0d9488' }}>-bathroom-finder</span>
              </span>
              <Badge
                bg="light"
                className="text-uppercase fw-bold"
                style={{ backgroundColor: '#ccfbf1', color: '#115e59', fontSize: '0.65rem' }}
              >
                Campus
              </Badge>
            </div>
            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
              Real-Time Restroom Intelligence
            </small>
          </div>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          {/* NAVIGATION TABS */}
          <Nav className="me-auto ms-lg-3 bg-light p-1 rounded-3 gap-1">
            <Nav.Link
              href="/"
              active={pathName === '/'}
              className={`px-3 py-1 rounded-2 fw-medium ${
                pathName === '/' ? 'bg-white shadow-sm fw-semibold' : 'text-secondary'
              }`}
              style={pathName === '/' ? { color: '#0f766e' } : undefined}
            >
              <i className="fa-solid fa-border-all me-1" /> Restroom Directory
            </Nav.Link>

            <Nav.Link
              href="/map"
              active={pathName === '/map'}
              className={`px-3 py-1 rounded-2 fw-medium ${
                pathName === '/map' ? 'bg-white shadow-sm fw-semibold' : 'text-secondary'
              }`}
              style={pathName === '/map' ? { color: '#0f766e' } : undefined}
            >
              <i className="fa-solid fa-map-location-dot me-1" /> Interactive Map
            </Nav.Link>

            <Nav.Link
              href="/dashboard"
              active={pathName === '/dashboard'}
              className={`px-3 py-1 rounded-2 fw-medium ${
                pathName === '/dashboard' ? 'bg-white shadow-sm fw-semibold' : 'text-secondary'
              }`}
              style={pathName === '/dashboard' ? { color: '#0f766e' } : undefined}
            >
              <i className="fa-solid fa-gauge me-1" /> My Dashboard
            </Nav.Link>

            {currentUser && role === 'ADMIN' ? (
              <Nav.Link
                href="/admin"
                active={pathName === '/admin'}
                className={`px-3 py-1 rounded-2 fw-medium d-flex align-items-center ${
                  pathName === '/admin' ? 'bg-white shadow-sm fw-semibold' : 'text-secondary'
                }`}
              >
                <i className="fa-solid fa-user-shield me-1 text-primary" /> Admin Queue
                <Badge bg="warning" text="dark" pill className="ms-1">
                  {pendingCount}
                </Badge>
              </Nav.Link>
            ) : (
              ''
            )}
          </Nav>

          {/* RIGHT SIDE: FAVORITES, LIVE REPORT & TEMPLATE AUTH DROPDOWN */}
          <Nav className="align-items-lg-center gap-2 mt-2 mt-lg-0">
            {/* Favorites Quick Link -> Dashboard */}
            <Nav.Link
              href="/dashboard"
              className="position-relative bg-light rounded-2 px-2 py-1 text-danger"
              title="View Favorited Restrooms"
            >
              <i className="fa-solid fa-heart fs-6" />
              <Badge
                bg="danger"
                pill
                className="position-absolute top-0 start-100 translate-middle"
                style={{ fontSize: '0.65rem' }}
              >
                {favoriteCount}
              </Badge>
            </Nav.Link>

            {/* Quick Live Report Button */}
            <Nav.Link
              href="/dashboard?report=true"
              className="btn btn-sm text-white fw-semibold px-3 py-2 rounded-2"
              style={{ backgroundColor: '#0d9488', borderColor: '#0d9488' }}
            >
              <i className="fa-solid fa-plus-circle me-1" /> Live Report
            </Nav.Link>

            {/* Template Auth Dropdown (Preserved for your teammate's sign-in flow) */}
            {currentUser ? (
              <NavDropdown id="login-dropdown" title={currentUser} align="end">
                <NavDropdown.Item id="login-dropdown-dashboard" href="/dashboard">
                  My Dashboard
                </NavDropdown.Item>
                <NavDropdown.Item id="login-dropdown-change-password" href="/auth/change-password">
                  <Lock className="me-1" /> Change Password
                </NavDropdown.Item>
                <NavDropdown.Item id="login-dropdown-sign-out" href="/api/auth/signout">
                  <BoxArrowRight className="me-1" /> Sign Out
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <NavDropdown id="login-dropdown" title="Login" align="end">
                <NavDropdown.Item id="login-dropdown-sign-in" href="/auth/signin">
                  <PersonFill className="me-1" /> Sign in
                </NavDropdown.Item>
                <NavDropdown.Item id="login-dropdown-sign-up" href="/auth/signup">
                  <PersonPlusFill className="me-1" /> Sign up
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;