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
  deleteRestroomAction,
  deleteReviewAction,
  saveRestroomAction,
  updateReviewStatusAction,
} from '@/lib/adminActions';
import { AdminRestroom, AdminReview, RestroomFormValues, ReviewStatus } from '@/types/admin';
import RestroomFormModal from './RestroomFormModal';

interface AdminDashboardClientProps {
  initialRestrooms: AdminRestroom[];
  initialReviews: AdminReview[];
}

export default function AdminDashboardClient({
  initialRestrooms,
  initialReviews,
}: AdminDashboardClientProps) {
  const [restrooms, setRestrooms] = useState<AdminRestroom[]>(initialRestrooms);
  const [reviews, setReviews] = useState<AdminReview[]>(initialReviews);

  // Moderation Queue filters
  const [reviewFilter, setReviewFilter] = useState<'ALL' | ReviewStatus>('ALL');
  const [reviewSearch, setReviewSearch] = useState('');

  // Restroom Directory filters
  const [roomSearch, setRoomSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [adaOnly, setAdaOnly] = useState(false);

  // Modal & Toast state
  const [showModal, setShowModal] = useState(false);
  const [editingRestroom, setEditingRestroom] = useState<AdminRestroom | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [deletedReviewBackup, setDeletedReviewBackup] = useState<AdminReview | null>(null);

  // Live KPI metrics
  const kpis = useMemo(() => {
    return {
      totalRestrooms: restrooms.length,
      pendingReviews: reviews.filter((r) => r.status === 'PENDING').length,
      flaggedReviews: reviews.filter((r) => r.status === 'FLAGGED').length,
      adaCount: restrooms.filter((r) => r.isAccessible).length,
    };
  }, [restrooms, reviews]);

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

  // Moderation handlers
  const handleReviewStatus = async (id: number, status: ReviewStatus) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setDeletedReviewBackup(null);
    setToastMsg(`Review #${id} marked as ${status}.`);
    await updateReviewStatusAction(id, status);
  };

  const handleRemoveReview = async (review: AdminReview) => {
    setDeletedReviewBackup(review);
    setReviews((prev) => prev.filter((r) => r.id !== review.id));
    setToastMsg(`Removed review by ${review.userEmail}.`);
    await deleteReviewAction(review.id);
  };

  const handleUndoRemoveReview = () => {
    if (!deletedReviewBackup) return;
    setReviews((prev) => [deletedReviewBackup, ...prev]);
    setDeletedReviewBackup(null);
    setToastMsg('Review restored to queue.');
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
    if (values.id) {
      setRestrooms((prev) =>
        prev.map((r) =>
          r.id === values.id
            ? {
                ...r,
                building: values.building,
                floor: values.floor,
                roomNumber: values.roomNumber,
                type: values.type,
                stallCount: values.stallCount,
                lastRenovated: values.lastRenovated ? Number(values.lastRenovated) : null,
                isAccessible: values.isAccessible,
                amenities: values.amenities,
                notes: values.notes,
              }
            : r,
        ),
      );
      setToastMsg(`Updated ${values.building} (Floor ${values.floor}).`);
    } else {
      const newRoom: AdminRestroom = {
        id: Date.now(),
        building: values.building,
        floor: values.floor,
        roomNumber: values.roomNumber,
        type: values.type,
        stallCount: values.stallCount,
        lastRenovated: values.lastRenovated ? Number(values.lastRenovated) : null,
        isAccessible: values.isAccessible,
        amenities: values.amenities,
        notes: values.notes,
        avgRating: 0,
        reviewCount: 0,
      };
      setRestrooms((prev) => [newRoom, ...prev]);
      setToastMsg(`Added ${values.building} (Floor ${values.floor}) to campus directory.`);
    }
    await saveRestroomAction(values);
  };

  const handleDeleteRestroom = async (room: AdminRestroom) => {
    const confirmed = window.confirm(
      `Delete ${room.building} — Floor ${room.floor}${room.roomNumber ? ` (Rm ${room.roomNumber})` : ''}?`,
    );
    if (!confirmed) return;

    setRestrooms((prev) => prev.filter((r) => r.id !== room.id));
    setDeletedReviewBackup(null);
    setToastMsg(`Deleted ${room.building} — Floor ${room.floor}.`);
    await deleteRestroomAction(room.id);
  };

  const renderStatusBadge = (status: ReviewStatus) => {
    if (status === 'PENDING') return <Badge bg="warning" text="dark">Pending Review</Badge>;
    if (status === 'FLAGGED') return <Badge bg="danger">Flagged</Badge>;
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
            Manage registered UH Mānoa restroom listings and moderate student cleanliness reviews.
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
                <div className="text-muted small fw-semibold">Pending Reviews</div>
                <div className="h3 fw-bold mb-0 mt-1">{kpis.pendingReviews}</div>
              </div>
              <div className="rounded-3 p-3 badge-soft-amber">
                <i className="fa-solid fa-clock fs-4" />
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
                <div className="text-muted small fw-semibold">ADA Accessible</div>
                <div className="h3 fw-bold mb-0 mt-1">{kpis.adaCount}</div>
              </div>
              <div className="rounded-3 p-3 bg-primary bg-opacity-10 text-primary">
                <i className="fa-solid fa-wheelchair fs-4" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* SECTION 1: REVIEW MODERATION QUEUE */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <h2 className="h5 fw-bold mb-0">
                <i className="fa-solid fa-shield-halved me-2 text-warning" />
                Review Moderation Queue
              </h2>
              <small className="text-muted">
                Verify student condition reports and remove spam or policy violations.
              </small>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <Nav variant="pills" className="small">
                {(['ALL', 'PENDING', 'FLAGGED', 'APPROVED'] as const).map((tab) => (
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
            <div className="divide-y">
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
                      <span>Cleanliness: <strong>{rev.cleanliness}/5</strong></span>
                      <span>Odor: <strong>{rev.odor}/5</strong></span>
                      {rev.conditionTags.map((tag) => (
                        <Badge key={tag} bg="light" text="dark" className="border">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <p className="mb-0 text-dark small">&ldquo;{rev.comment}&rdquo;</p>
                  </div>

                  <div className="d-flex flex-shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant={rev.status === 'APPROVED' ? 'success' : 'outline-success'}
                      onClick={() => handleReviewStatus(rev.id, 'APPROVED')}
                    >
                      <i className="fa-solid fa-check me-1" /> Approve
                    </Button>
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
                      onClick={() => handleRemoveReview(rev)}
                    >
                      <i className="fa-solid fa-trash me-1" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* SECTION 2: REGISTERED CAMPUS RESTROOMS TABLE */}
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
                        <Badge key={amenity} bg="secondary" bg-opacity="10" className="fw-normal">
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
          <Toast.Body className="d-flex align-items-center justify-content-between gap-3">
            <span>{toastMsg}</span>
            {deletedReviewBackup && (
              <Button size="sm" variant="warning" onClick={handleUndoRemoveReview}>
                Undo
              </Button>
            )}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}