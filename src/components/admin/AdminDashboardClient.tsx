'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Nav,
  Row,
  Table,
  Toast,
  ToastContainer,
} from 'react-bootstrap';
import {
  approveBathroomRequestAction,
  deleteRestroomAction,
  deleteReviewAction,
  rejectBathroomRequestAction,
  saveRestroomAction,
  toggleUserSuspensionAction,
  updateReviewStatusAction,
} from '@/lib/adminActions';
import {
  AdminBathroomRequest,
  AdminRestroom,
  AdminReview,
  AdminUserAccount,
  RequestStatus,
  RestroomFormValues,
  ReviewStatus,
} from '@/types/admin';
import RestroomFormModal from './RestroomFormModal';

interface AdminDashboardClientProps {
  initialRestrooms: AdminRestroom[];
  initialReviews: AdminReview[];
  initialRequests: AdminBathroomRequest[];
  initialUsers: AdminUserAccount[];
  currentAdminEmail: string;
}

export default function AdminDashboardClient({
  initialRestrooms,
  initialReviews,
  initialRequests,
  initialUsers,
  currentAdminEmail,
}: AdminDashboardClientProps) {
  const [restrooms, setRestrooms] = useState<AdminRestroom[]>(initialRestrooms);
  const [reviews, setReviews] = useState<AdminReview[]>(initialReviews);
  const [requests, setRequests] = useState<AdminBathroomRequest[]>(initialRequests);
  const [users, setUsers] = useState<AdminUserAccount[]>(initialUsers);

  // Bathroom Requests filters
  const [requestFilter, setRequestFilter] = useState<'ALL' | RequestStatus>('PENDING');

  // Moderation Queue filters
  const [reviewFilter, setReviewFilter] = useState<'ALL' | ReviewStatus>('ALL');
  const [reviewSearch, setReviewSearch] = useState('');

  // User Management filters
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Restroom Directory filters
  const [roomSearch, setRoomSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [adaOnly, setAdaOnly] = useState(false);

  // Modal & Toast state
  const [showModal, setShowModal] = useState(false);
  const [editingRestroom, setEditingRestroom] = useState<AdminRestroom | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Live KPI metrics
  const kpis = useMemo(() => {
    return {
      totalRestrooms: restrooms.length,
      pendingRequests: requests.filter((req) => req.status === 'PENDING').length,
      flaggedReviews: reviews.filter((r) => r.status === 'FLAGGED').length,
      suspendedUsers: users.filter((u) => u.isSuspended).length,
    };
  }, [restrooms, requests, reviews, users]);

  // Filtered bathroom requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => requestFilter === 'ALL' || req.status === requestFilter);
  }, [requests, requestFilter]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      const matchesStatus = reviewFilter === 'ALL' || rev.status === reviewFilter;
      const q = reviewSearch.toLowerCase();
      const matchesQuery =
        !q ||
        rev.restroomLabel.toLowerCase().includes(q) ||
        rev.userEmail.toLowerCase().includes(q) ||
        rev.comment.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [reviews, reviewFilter, reviewSearch]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery = !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesStatus =
        userStatusFilter === 'ALL' ||
        (userStatusFilter === 'SUSPENDED' && u.isSuspended) ||
        (userStatusFilter === 'ACTIVE' && !u.isSuspended);
      return matchesQuery && matchesStatus;
    });
  }, [users, userSearch, userStatusFilter]);

  // Filtered restrooms
  const filteredRestrooms = useMemo(() => {
    return restrooms.filter((room) => {
      const q = roomSearch.toLowerCase();
      const matchesQuery =
        !q ||
        room.building.toLowerCase().includes(q) ||
        room.floor.toLowerCase().includes(q) ||
        room.roomNumber.toLowerCase().includes(q);
      const matchesType = typeFilter === 'ALL' || room.type === typeFilter;
      const matchesAda = !adaOnly || room.isAccessible;
      return matchesQuery && matchesType && matchesAda;
    });
  }, [restrooms, roomSearch, typeFilter, adaOnly]);

  // Bathroom Request approval / rejection handlers
  const handleApproveRequest = async (req: AdminBathroomRequest) => {
    try {
      const { restroom, mode } = await approveBathroomRequestAction(req.id);
      setRequests((prev) =>
        prev.map((item) =>
          item.id === req.id ? { ...item, status: 'APPROVED', bathroomId: restroom.id } : item,
        ),
      );

      if (mode === 'UPDATED') {
        setRestrooms((prev) =>
          prev.map((room) =>
            room.id === restroom.id
              ? { ...restroom, avgRating: room.avgRating, reviewCount: room.reviewCount }
              : room,
          ),
        );
        setToastMsg(`Applied correction to ${restroom.building} — Floor ${restroom.floor}.`);
      } else {
        setRestrooms((prev) => [restroom, ...prev]);
        setToastMsg(`Added new restroom: ${restroom.building} — Floor ${restroom.floor}.`);
      }
    } catch (err) {
      setToastMsg(err instanceof Error ? err.message : 'Failed to approve request.');
    }
  };

  const handleRejectRequest = async (req: AdminBathroomRequest) => {
    try {
      await rejectBathroomRequestAction(req.id);
      setRequests((prev) =>
        prev.map((item) => (item.id === req.id ? { ...item, status: 'REJECTED' } : item)),
      );
      setToastMsg(`Rejected request for ${req.building} — Floor ${req.floor}.`);
    } catch (err) {
      setToastMsg(err instanceof Error ? err.message : 'Failed to reject request.');
    }
  };

  // Review moderation handlers
  const handleReviewStatus = async (id: number, status: ReviewStatus) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setToastMsg(`Review #${id} marked as ${status}.`);
    await updateReviewStatusAction(id, status);
  };

  const handleDeleteReview = async (review: AdminReview) => {
    const confirmed = window.confirm(
      `Permanently delete review by ${review.userEmail} on ${review.restroomLabel}?`,
    );
    if (!confirmed) return;

    setReviews((prev) => prev.filter((r) => r.id !== review.id));
    setToastMsg(`Deleted review by ${review.userEmail}.`);
    await deleteReviewAction(review.id);
  };

  // User suspension / restoration handler
  const handleToggleSuspension = async (user: AdminUserAccount) => {
    const nextSuspended = !user.isSuspended;
    const actionLabel = nextSuspended ? 'Suspend' : 'Restore';
    const confirmed = window.confirm(
      `${actionLabel} account for ${user.email}?${
        nextSuspended ? ' They will be blocked from signing in until restored.' : ''
      }`,
    );
    if (!confirmed) return;

    try {
      await toggleUserSuspensionAction(user.id, nextSuspended);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isSuspended: nextSuspended } : u)),
      );
      setToastMsg(
        nextSuspended ? `Suspended ${user.email}.` : `Restored account access for ${user.email}.`,
      );
    } catch (err) {
      setToastMsg(err instanceof Error ? err.message : 'Failed to update user status.');
    }
  };

  // Restroom CRUD handlers
  const handleOpenAddModal = () => {
    setEditingRestroom(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (room: AdminRestroom) => {
    setEditingRestroom(room);
    setShowModal(true);
  };

  const handleSaveRestroom = async (values: RestroomFormValues) => {
    const saved = await saveRestroomAction(values);
    if (values.id) {
      setRestrooms((prev) =>
        prev.map((r) =>
          r.id === saved.id
            ? { ...saved, avgRating: r.avgRating, reviewCount: r.reviewCount }
            : r,
        ),
      );
      setToastMsg(`Updated ${saved.building} (Floor ${saved.floor}).`);
    } else {
      setRestrooms((prev) => [saved, ...prev]);
      setToastMsg(`Added ${saved.building} (Floor ${saved.floor}) to campus directory.`);
    }
  };

  const handleDeleteRestroom = async (room: AdminRestroom) => {
    const confirmed = window.confirm(
      `Delete ${room.building} — Floor ${room.floor}${room.roomNumber ? ` (Rm ${room.roomNumber})` : ''}?`,
    );
    if (!confirmed) return;

    setRestrooms((prev) => prev.filter((r) => r.id !== room.id));
    setToastMsg(`Deleted ${room.building} — Floor ${room.floor}.`);
    await deleteRestroomAction(room.id);
  };

  const renderStatusBadge = (status: ReviewStatus) => {
    if (status === 'PENDING') return <Badge bg="warning" text="dark">Pending</Badge>;
    if (status === 'FLAGGED') return <Badge bg="danger">Flagged</Badge>;
    if (status === 'REJECTED') return <Badge bg="secondary">Rejected</Badge>;
    return <Badge bg="success">Approved</Badge>;
  };

  return (
    <Container className="py-4">
      {/* PAGE HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h3 fw-bold mb-0">Site Administration Console</h1>
            <Badge className="badge-soft-teal">Admin Access</Badge>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Approve bathroom proposals, moderate reviews, manage user accounts, and maintain the UH
            Mānoa restroom directory.
          </p>
        </div>

        <Button
          onClick={handleOpenAddModal}
          className="btn-brand-teal text-white fw-semibold px-3 py-2 shadow-sm"
        >
          <i className="fa-solid fa-plus me-2" />
          Add New Restroom
        </Button>
      </div>

      {/* KPI SUMMARY CARDS */}
      <Row className="g-3 mb-4">
        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100 admin-kpi-card">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Registered Restrooms</div>
                <div className="h3 fw-bold mb-0 mt-1">{kpis.totalRestrooms}</div>
              </div>
              <div className="rounded-3 p-3 badge-soft-teal">
                <i className="fa-solid fa-restroom fs-4" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100 admin-kpi-card">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Pending Requests</div>
                <div className="h3 fw-bold mb-0 mt-1">{kpis.pendingRequests}</div>
              </div>
              <div className="rounded-3 p-3 badge-soft-amber">
                <i className="fa-solid fa-inbox fs-4" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100 admin-kpi-card">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Flagged Reviews</div>
                <div className="h3 fw-bold mb-0 mt-1">{kpis.flaggedReviews}</div>
              </div>
              <div className="rounded-3 p-3 badge-soft-rose">
                <i className="fa-solid fa-flag fs-4" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={6} lg={3}>
          <Card className="border-0 shadow-sm h-100 admin-kpi-card">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Suspended Users</div>
                <div className="h3 fw-bold mb-0 mt-1">{kpis.suspendedUsers}</div>
              </div>
              <div className="rounded-3 p-3 bg-secondary bg-opacity-10 text-secondary">
                <i className="fa-solid fa-user-slash fs-4" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* SECTION 1: BATHROOM ADDITION & CHANGE REQUESTS */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <h2 className="h5 fw-bold mb-0">
                <i className="fa-solid fa-clipboard-check me-2 text-teal" />
                Bathroom Addition &amp; Change Requests
              </h2>
              <small className="text-muted">
                Review community submissions to add new restrooms or update existing location info.
              </small>
            </div>

            <Nav variant="pills" className="small">
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
                <Nav.Item key={tab}>
                  <Nav.Link
                    active={requestFilter === tab}
                    onClick={() => setRequestFilter(tab)}
                    className="py-1 px-2.5"
                  >
                    {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No bathroom proposals or change requests in this queue.
            </div>
          ) : (
            <div>
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 p-md-4 border-bottom d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3"
                >
                  <div>
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <Badge bg={req.requestType === 'NEW_BATHROOM' ? 'info' : 'primary'}>
                        {req.requestType === 'NEW_BATHROOM' ? 'New Bathroom' : 'Change Request'}
                      </Badge>
                      {renderStatusBadge(req.status)}
                      <span className="fw-bold text-dark">
                        {req.building} — Floor {req.floor}
                        {req.roomNumber ? ` (Rm ${req.roomNumber})` : ''}
                      </span>
                      <span className="text-muted small">
                        • submitted by <code>{req.userEmail}</code> ({req.createdAt})
                      </span>
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-2 small text-secondary mb-1">
                      <span>{req.type}</span>
                      <span>• {req.stallCount} stall(s)</span>
                      {req.lastRenovated && <span>• Renovated {req.lastRenovated}</span>}
                      {req.isAccessible && (
                        <Badge bg="primary" className="fw-normal">
                          ADA Accessible
                        </Badge>
                      )}
                      {req.amenities.map((amenity) => (
                        <Badge key={amenity} bg="light" text="dark" className="border">
                          {amenity}
                        </Badge>
                      ))}
                    </div>

                    {req.notes && <p className="mb-0 text-dark small">{req.notes}</p>}
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="d-flex flex-shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleApproveRequest(req)}
                      >
                        <i className="fa-solid fa-check me-1" />
                        {req.requestType === 'NEW_BATHROOM' ? 'Approve & Add' : 'Approve Changes'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleRejectRequest(req)}
                      >
                        <i className="fa-solid fa-xmark me-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* SECTION 2: REVIEW MODERATION QUEUE */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <h2 className="h5 fw-bold mb-0">
                <i className="fa-solid fa-shield-halved me-2 text-warning" />
                Review Moderation Queue
              </h2>
              <small className="text-muted">
                Flag inappropriate submissions or delete spam and policy violations.
              </small>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <Nav variant="pills" className="small">
                {(['ALL', 'FLAGGED', 'APPROVED', 'PENDING'] as const).map((tab) => (
                  <Nav.Item key={tab}>
                    <Nav.Link
                      active={reviewFilter === tab}
                      onClick={() => setReviewFilter(tab)}
                      className="py-1 px-2.5"
                    >
                      {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>

              <InputGroup size="sm" style={{ width: '230px' }}>
                <InputGroup.Text className="bg-light">
                  <i className="fa-solid fa-magnifying-glass text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search building or user..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                />
              </InputGroup>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-circle-check fs-2 text-success mb-2 d-block" />
              No reviews match the selected filter.
            </div>
          ) : (
            <div>
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 p-md-4 border-bottom d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3"
                >
                  <div>
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      {renderStatusBadge(rev.status)}
                      <span className="fw-bold text-dark">{rev.restroomLabel}</span>
                      <span className="text-muted small">
                        • by <code>{rev.userEmail}</code> ({rev.createdAt})
                      </span>
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-3 small text-secondary mb-2">
                      <span>
                        <i className="fa-solid fa-star text-warning me-1" />
                        Overall: <strong>{rev.overallScore}/5</strong>
                      </span>
                      <span>
                        Cleanliness: <strong>{rev.cleanliness}/5</strong>
                      </span>
                      <span>
                        Odor: <strong>{rev.odor}/5</strong>
                      </span>
                      {rev.conditionTags.map((tag) => (
                        <Badge key={tag} bg="light" text="dark" className="border">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {rev.comment && (
                      <p className="mb-0 text-dark small">&ldquo;{rev.comment}&rdquo;</p>
                    )}
                  </div>

                  <div className="d-flex flex-shrink-0 gap-2">
                    {rev.status !== 'APPROVED' && (
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => handleReviewStatus(rev.id, 'APPROVED')}
                      >
                        <i className="fa-solid fa-check me-1" /> Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={rev.status === 'FLAGGED' ? 'warning' : 'outline-warning'}
                      onClick={() => handleReviewStatus(rev.id, 'FLAGGED')}
                    >
                      <i className="fa-solid fa-flag me-1" /> Flag
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDeleteReview(rev)}
                    >
                      <i className="fa-solid fa-trash me-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* SECTION 3: USER ACCOUNT MANAGEMENT */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <h2 className="h5 fw-bold mb-0">
                <i className="fa-solid fa-users-gear me-2 text-secondary" />
                User Account Management ({filteredUsers.length})
              </h2>
              <small className="text-muted">
                Suspend abusive accounts or restore access to suspended users.
              </small>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <Nav variant="pills" className="small">
                {(['ALL', 'ACTIVE', 'SUSPENDED'] as const).map((tab) => (
                  <Nav.Item key={tab}>
                    <Nav.Link
                      active={userStatusFilter === tab}
                      onClick={() => setUserStatusFilter(tab)}
                      className="py-1 px-2.5"
                    >
                      {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>

              <InputGroup size="sm" style={{ width: '220px' }}>
                <InputGroup.Text className="bg-light">
                  <i className="fa-solid fa-magnifying-glass text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search user email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </InputGroup>
            </div>
          </div>
        </Card.Header>

        <Table responsive hover className="align-middle mb-0">
          <thead className="table-light small text-uppercase text-muted">
            <tr>
              <th className="ps-4">Email</th>
              <th>Role</th>
              <th>Contributions</th>
              <th>Account Status</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((account) => {
              const isSelf = account.email === currentAdminEmail;
              return (
                <tr key={account.id}>
                  <td className="ps-4 fw-semibold text-dark">
                    {account.email}{' '}
                    {isSelf && (
                      <Badge bg="light" text="dark" className="border ms-1">
                        You
                      </Badge>
                    )}
                  </td>
                  <td>
                    <Badge bg={account.role === 'ADMIN' ? 'dark' : 'secondary'}>
                      {account.role}
                    </Badge>
                  </td>
                  <td className="small text-muted">
                    {account.reviewCount} reviews • {account.reportCount} reports •{' '}
                    {account.requestCount} requests
                  </td>
                  <td>
                    {account.isSuspended ? (
                      <Badge bg="danger">Suspended</Badge>
                    ) : (
                      <Badge bg="success">Active</Badge>
                    )}
                  </td>
                  <td className="text-end pe-4">
                    {account.isSuspended ? (
                      <Button
                        size="sm"
                        variant="outline-success"
                        disabled={isSelf}
                        onClick={() => handleToggleSuspension(account)}
                      >
                        <i className="fa-solid fa-user-check me-1" /> Restore Account
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={isSelf}
                        onClick={() => handleToggleSuspension(account)}
                      >
                        <i className="fa-solid fa-user-slash me-1" /> Suspend Account
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {/* SECTION 4: REGISTERED CAMPUS RESTROOMS TABLE */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <h2 className="h5 fw-bold mb-0">
                <i className="fa-solid fa-building-columns me-2 text-primary" />
                Registered Campus Restrooms ({filteredRestrooms.length})
              </h2>
              <small className="text-muted">
                Edit static facility details, accessibility tags, or remove decommissioned locations.
              </small>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <InputGroup size="sm" style={{ width: '220px' }}>
                <InputGroup.Text className="bg-light">
                  <i className="fa-solid fa-magnifying-glass text-muted" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Building, floor, room..."
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                />
              </InputGroup>

              <Form.Select
                size="sm"
                style={{ width: '210px' }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Restroom Types</option>
                <option value="Multi-Stall (Men & Women)">Multi-Stall (Men &amp; Women)</option>
                <option value="All-Gender / Single-Stall">All-Gender / Single-Stall</option>
                <option value="Men">Men&apos;s Only</option>
                <option value="Women">Women&apos;s Only</option>
              </Form.Select>

              <Form.Check
                type="switch"
                id="ada-filter-switch"
                label="ADA Only"
                className="small fw-semibold ms-1"
                checked={adaOnly}
                onChange={(e) => setAdaOnly(e.target.checked)}
              />
            </div>
          </div>
        </Card.Header>

        <Table responsive hover className="align-middle mb-0">
          <thead className="table-light small text-uppercase text-muted">
            <tr>
              <th className="ps-4">Building &amp; Location</th>
              <th>Type</th>
              <th>Stalls</th>
              <th>Renovated</th>
              <th>Accessibility &amp; Amenities</th>
              <th>Rating</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRestrooms.map((room) => (
              <tr key={room.id}>
                <td className="ps-4">
                  <div className="fw-bold text-dark">{room.building}</div>
                  <div className="small text-muted">
                    Floor {room.floor} {room.roomNumber ? `• Room ${room.roomNumber}` : ''}
                  </div>
                </td>
                <td>
                  <Badge bg="light" text="dark" className="border fw-normal">
                    {room.type}
                  </Badge>
                </td>
                <td className="fw-semibold">{room.stallCount}</td>
                <td>{room.lastRenovated ?? <span className="text-muted">N/A</span>}</td>
                <td>
                  <div className="d-flex flex-wrap gap-1">
                    {room.isAccessible && (
                      <Badge bg="primary" className="fw-normal">
                        <i className="fa-solid fa-wheelchair me-1" /> ADA
                      </Badge>
                    )}
                    {room.amenities
                      .filter((a) => a !== 'ADA Accessible')
                      .map((amenity) => (
                        <Badge key={amenity} bg="secondary" className="fw-normal">
                          {amenity}
                        </Badge>
                      ))}
                  </div>
                </td>
                <td>
                  {room.reviewCount > 0 ? (
                    <span className="small fw-semibold">
                      <i className="fa-solid fa-star text-warning me-1" />
                      {room.avgRating.toFixed(1)}{' '}
                      <span className="text-muted fw-normal">({room.reviewCount})</span>
                    </span>
                  ) : (
                    <span className="small text-muted">No reviews</span>
                  )}
                </td>
                <td className="text-end pe-4">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="me-2"
                    onClick={() => handleOpenEditModal(room)}
                  >
                    <i className="fa-solid fa-pen-to-square me-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleDeleteRestroom(room)}
                  >
                    <i className="fa-solid fa-trash me-1" /> Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* ADD / EDIT RESTROOM MODAL */}
      <RestroomFormModal
        key={showModal ? `restroom-${editingRestroom?.id ?? 'new'}` : 'restroom-closed'}
        show={showModal}
        editingRestroom={editingRestroom}
        onHide={() => setShowModal(false)}
        onSave={handleSaveRestroom}
      />

      {/* ACTION FEEDBACK TOAST */}
      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={Boolean(toastMsg)}
          onClose={() => setToastMsg(null)}
          delay={4500}
          autohide
          bg="dark"
          className="text-white"
        >
          <Toast.Body>{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}