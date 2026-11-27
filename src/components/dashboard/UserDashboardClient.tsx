// src/components/dashboard/UserDashboardClient.tsx
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { DashboardData } from '@/lib/dashboardData';
import {
  createConditionReportAction,
  createReviewAction,
  deleteConditionReportAction,
  deleteReviewAction,
  submitBathroomRequestAction,
  toggleFavoriteAction,
} from '@/lib/dashboardActions';

interface Props {
  data: DashboardData;
}

const QUICK_CONDITIONS = [
  'Freshly Sanitized',
  'Well Stocked',
  'Low Paper Towels',
  'Missing Soap',
  'High Odor',
  'Crowded',
  'Needs Maintenance',
];

const CONDITION_TAGS = [
  'Clean Sinks',
  'Stocked Paper',
  'Soap Full',
  'Good Ventilation',
  'ADA Accessible',
  'Needs Cleaning',
];

const AMENITY_OPTIONS = [
  'ADA Accessible',
  'Baby Changing Station',
  'Touchless Faucets',
  'Air Dryer',
  'Paper Towels',
  'Gender Neutral',
];

export default function UserDashboardClient({ data }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'danger'; text: string } | null>(
    null,
  );

  // Favorite selector state
  const [selectedFavBathroomId, setSelectedFavBathroomId] = useState<number>(
    data.bathrooms[0]?.id ?? 0,
  );

  // Modal visibility states
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Quick Condition Report form state
  const [reportBathroomId, setReportBathroomId] = useState<number>(data.bathrooms[0]?.id ?? 0);
  const [reportCondition, setReportCondition] = useState<string>(QUICK_CONDITIONS[0]);
  const [reportNote, setReportNote] = useState<string>('');

  // Full 5-Star Review form state
  const [reviewBathroomId, setReviewBathroomId] = useState<number>(data.bathrooms[0]?.id ?? 0);
  const [overallScore, setOverallScore] = useState<number>(5);
  const [cleanliness, setCleanliness] = useState<number>(5);
  const [odor, setOdor] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Clean Sinks']);
  const [reviewComment, setReviewComment] = useState<string>('');

  // Bathroom Request / Correction form state
  const [requestType, setRequestType] = useState<'NEW_BATHROOM' | 'CORRECTION'>('NEW_BATHROOM');
  const [targetBathroomId, setTargetBathroomId] = useState<number>(data.bathrooms[0]?.id ?? 0);
  const [reqBuilding, setReqBuilding] = useState<string>('');
  const [reqFloor, setReqFloor] = useState<string>('');
  const [reqRoomNumber, setReqRoomNumber] = useState<string>('');
  const [reqType, setReqType] = useState<string>('Multi-Stall (Men & Women)');
  const [reqStallCount, setReqStallCount] = useState<number>(2);
  const [reqLastRenovated, setReqLastRenovated] = useState<string>('');
  const [reqAccessible, setReqAccessible] = useState<boolean>(false);
  const [reqAmenities, setReqAmenities] = useState<string[]>([]);
  const [reqNotes, setReqNotes] = useState<string>('');

  // Auto-open Quick Condition Report modal if Navbar "Live Report" (/dashboard?report=true) is clicked
  useEffect(() => {
    if (searchParams.get('report') === 'true' && data.bathrooms.length > 0) {
      setReportBathroomId((prev) => prev || data.bathrooms[0].id);
      setShowReportModal(true);
      router.replace('/dashboard');
    }
  }, [searchParams, data.bathrooms, router]);

  const openReportForBathroom = (bathroomId?: number) => {
    if (bathroomId) setReportBathroomId(bathroomId);
    else if (!reportBathroomId && data.bathrooms[0]) setReportBathroomId(data.bathrooms[0].id);
    setReportNote('');
    setShowReportModal(true);
  };

  const openReviewForBathroom = (bathroomId?: number) => {
    if (bathroomId) setReviewBathroomId(bathroomId);
    else if (!reviewBathroomId && data.bathrooms[0]) setReviewBathroomId(data.bathrooms[0].id);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleRequestTypeSwitch = (mode: 'NEW_BATHROOM' | 'CORRECTION') => {
    setRequestType(mode);
    if (mode === 'CORRECTION' && data.bathrooms.length > 0) {
      const selected =
        data.bathrooms.find((b) => b.id === targetBathroomId) ?? data.bathrooms[0];
      setTargetBathroomId(selected.id);
      setReqBuilding(selected.building);
      setReqFloor(selected.floor);
      setReqRoomNumber(selected.roomNumber);
      setReqType(selected.type);
      setReqStallCount(selected.stallCount);
      setReqLastRenovated(selected.lastRenovated ? String(selected.lastRenovated) : '');
      setReqAccessible(selected.isAccessible);
      setReqAmenities(selected.amenities);
      setReqNotes(selected.notes);
    } else {
      setReqBuilding('');
      setReqFloor('');
      setReqRoomNumber('');
      setReqType('Multi-Stall (Men & Women)');
      setReqStallCount(2);
      setReqLastRenovated('');
      setReqAccessible(false);
      setReqAmenities([]);
      setReqNotes('');
    }
  };

  const handleTargetBathroomChange = (id: number) => {
    setTargetBathroomId(id);
    const found = data.bathrooms.find((b) => b.id === id);
    if (found) {
      setReqBuilding(found.building);
      setReqFloor(found.floor);
      setReqRoomNumber(found.roomNumber);
      setReqType(found.type);
      setReqStallCount(found.stallCount);
      setReqLastRenovated(found.lastRenovated ? String(found.lastRenovated) : '');
      setReqAccessible(found.isAccessible);
      setReqAmenities(found.amenities);
      setReqNotes(found.notes);
    }
  };

  const handleToggleFavorite = (bathroomId: number) => {
    if (!bathroomId) return;
    startTransition(async () => {
      try {
        await toggleFavoriteAction(data.user.email, bathroomId);
        setFeedback({ type: 'success', text: 'Updated your saved favorites.' });
      } catch (err) {
        setFeedback({
          type: 'danger',
          text: err instanceof Error ? err.message : 'Could not update favorite.',
        });
      }
    });
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportBathroomId) return;
    startTransition(async () => {
      try {
        await createConditionReportAction(data.user.email, {
          bathroomId: reportBathroomId,
          condition: reportCondition,
          note: reportNote,
        });
        setShowReportModal(false);
        setFeedback({ type: 'success', text: 'Live condition report posted!' });
      } catch (err) {
        setFeedback({
          type: 'danger',
          text: err instanceof Error ? err.message : 'Failed to post condition report.',
        });
      }
    });
  };

const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBathroomId) return;
    startTransition(async () => {
      try {
        await createReviewAction(data.user.email, {
          bathroomId: reviewBathroomId,
          overallScore,
          cleanliness,
          odor,
          conditionTags: selectedTags,
          comment: reviewComment,
        });
        setShowReviewModal(false);
        setFeedback({
          type: 'success',
          text: 'Review posted!',
        });
      } catch (err) {
        setFeedback({
          type: 'danger',
          text: err instanceof Error ? err.message : 'Failed to submit review.',
        });
      }
    });
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await submitBathroomRequestAction(data.user.email, {
          requestType,
          bathroomId: requestType === 'CORRECTION' ? targetBathroomId : null,
          building: reqBuilding,
          floor: reqFloor,
          roomNumber: reqRoomNumber,
          type: reqType,
          stallCount: reqStallCount,
          lastRenovated: reqLastRenovated ? Number(reqLastRenovated) : null,
          isAccessible: reqAccessible,
          amenities: reqAmenities,
          notes: reqNotes,
        });
        setShowRequestModal(false);
        setFeedback({
          type: 'success',
          text:
            requestType === 'NEW_BATHROOM'
              ? 'New restroom proposal sent to admin queue!'
              : 'Correction request sent to admin queue!',
        });
      } catch (err) {
        setFeedback({
          type: 'danger',
          text: err instanceof Error ? err.message : 'Failed to submit request.',
        });
      }
    });
  };

  const handleDeleteReview = (reviewId: number) => {
    startTransition(async () => {
      try {
        await deleteReviewAction(data.user.email, reviewId);
        setFeedback({ type: 'success', text: 'Review deleted.' });
      } catch {
        setFeedback({ type: 'danger', text: 'Failed to delete review.' });
      }
    });
  };

  const handleDeleteReport = (reportId: number) => {
    startTransition(async () => {
      try {
        await deleteConditionReportAction(data.user.email, reportId);
        setFeedback({ type: 'success', text: 'Condition report removed.' });
      } catch {
        setFeedback({ type: 'danger', text: 'Failed to delete condition report.' });
      }
    });
  };

  const favoritedIds = new Set(data.favorites.map((f) => f.id));
  const unfavoritedBathrooms = data.bathrooms.filter((b) => !favoritedIds.has(b.id));

  const statusBadgeClass = (status: string) => {
    if (status === 'APPROVED') return 'bg-success-subtle text-success-emphasis';
    if (status === 'REJECTED') return 'bg-danger-subtle text-danger-emphasis';
    if (status === 'FLAGGED') return 'bg-warning text-dark';
    return 'bg-warning-subtle text-warning-emphasis';
  };

  return (
    <main className="container py-4 flex-grow-1">
      {feedback && (
        <div
          className={`alert alert-${feedback.type} alert-dismissible fade show shadow-sm`}
          role="alert"
        >
          {feedback.text}
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setFeedback(null)}
          />
        </div>
      )}

      {/* Header & Primary Actions */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3 p-4">
          <div>
            <h1 className="h3 fw-bold text-dark mb-1">User Dashboard</h1>
            <p className="text-muted small mb-0">
              Signed in as <strong className="text-dark">{data.user.email}</strong>{' '}
              <span className="badge bg-secondary ms-1">{data.user.role}</span>
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn text-white fw-semibold"
              style={{ backgroundColor: '#0d9488' }}
              onClick={() => openReportForBathroom()}
              disabled={data.bathrooms.length === 0}
            >
              <i className="fa-solid fa-bolt me-1" /> Quick Condition Report
            </button>

            <button
              type="button"
              className="btn btn-outline-dark fw-semibold"
              onClick={() => openReviewForBathroom()}
              disabled={data.bathrooms.length === 0}
            >
              <i className="fa-solid fa-star me-1 text-warning" /> Write Review
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary fw-semibold"
              onClick={() => {
                handleRequestTypeSwitch('NEW_BATHROOM');
                setShowRequestModal(true);
              }}
            >
              <i className="fa-solid fa-plus me-1" /> Propose Bathroom / Correction
            </button>

            {data.user.role === 'ADMIN' && (
              <Link href="/admin" className="btn btn-dark fw-semibold">
                <i className="fa-solid fa-user-shield me-1" /> Admin Queue
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="text-muted small">Saved Favorites</div>
              <div className="h3 fw-bold text-dark mb-0">{data.favorites.length}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="text-muted small">Reviews Written</div>
              <div className="h3 fw-bold text-dark mb-0">{data.reviews.length}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="text-muted small">Quick Reports</div>
              <div className="h3 fw-bold text-dark mb-0">{data.reports.length}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="text-muted small">Bathroom Requests</div>
              <div className="h3 fw-bold text-dark mb-0">{data.requests.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Favorited Bathrooms */}
      <section className="mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h2 className="h5 fw-bold text-dark mb-0">
            <i className="fa-solid fa-heart text-danger me-2" />
            My Favorite Bathrooms
          </h2>

          {unfavoritedBathrooms.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <select
                className="form-select form-select-sm"
                style={{ maxWidth: '280px' }}
                value={
                  unfavoritedBathrooms.some((b) => b.id === selectedFavBathroomId)
                    ? selectedFavBathroomId
                    : unfavoritedBathrooms[0].id
                }
                onChange={(e) => setSelectedFavBathroomId(Number(e.target.value))}
              >
                {unfavoritedBathrooms.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger text-nowrap"
                disabled={isPending}
                onClick={() => {
                  const targetId = unfavoritedBathrooms.some((b) => b.id === selectedFavBathroomId)
                    ? selectedFavBathroomId
                    : unfavoritedBathrooms[0].id;
                  handleToggleFavorite(targetId);
                }}
              >
                <i className="fa-solid fa-heart-circle-plus me-1" /> Save Favorite
              </button>
            </div>
          )}
        </div>

        {data.favorites.length === 0 ? (
          <div className="card shadow-sm border-0">
            <div className="card-body text-center text-muted py-4">
              No saved favorite restrooms yet. Pick a campus restroom above or favorite one from
              the directory to track live conditions here.
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {data.favorites.map((bathroom) => (
              <div key={bathroom.id} className="col-md-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-body d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h3 className="h6 fw-bold text-dark mb-1">
                            {bathroom.building} — Floor {bathroom.floor}
                            {bathroom.roomNumber ? ` (Room ${bathroom.roomNumber})` : ''}
                          </h3>
                          <p className="text-muted small mb-2">{bathroom.types.join(' • ')}</p>
                        </div>
                        <span className="badge bg-warning text-dark fs-6">
                          ★ {bathroom.overallRating > 0 ? bathroom.overallRating.toFixed(1) : 'New'}
                        </span>
                      </div>

                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {bathroom.isAccessible && (
                          <span className="badge bg-primary-subtle text-primary-emphasis">
                            Accessible
                          </span>
                        )}
                        {bathroom.isRenovated && (
                          <span className="badge bg-info-subtle text-info-emphasis">Renovated</span>
                        )}
                        <span className="badge bg-success-subtle text-success-emphasis">
                          Latest: {bathroom.latestCondition}
                        </span>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
                      <button
                        type="button"
                        className="btn btn-sm text-white fw-semibold"
                        style={{ backgroundColor: '#0d9488' }}
                        onClick={() => openReportForBathroom(bathroom.id)}
                      >
                        <i className="fa-solid fa-bolt me-1" /> Quick Report
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => openReviewForBathroom(bathroom.id)}
                      >
                        <i className="fa-solid fa-star me-1" /> Review
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger ms-auto"
                        disabled={isPending}
                        onClick={() => handleToggleFavorite(bathroom.id)}
                      >
                        <i className="fa-solid fa-heart-crack me-1" /> Unfavorite
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reviews, Quick Reports, and Bathroom Requests */}
      <div className="row g-3">
        {/* My Reviews */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h6 fw-bold text-dark mb-0">My Reviews</h2>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold"
                  style={{ color: '#0d9488' }}
                  onClick={() => openReviewForBathroom()}
                  disabled={data.bathrooms.length === 0}
                >
                  + Add
                </button>
              </div>

              {data.reviews.length === 0 ? (
                <p className="text-muted small mb-0">You have not written any reviews yet.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {data.reviews.map((review) => (
                    <li key={review.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div className="fw-semibold text-dark small">
                          {review.bathroomLabel} — ★ {review.overallScore}/5
                        </div>
                        <span className={`badge ${statusBadgeClass(review.status)}`}>
                          {review.status}
                        </span>
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Cleanliness: {review.cleanliness}/5 • Odor: {review.odor}/5 •{' '}
                        {review.createdAt}
                      </div>
                      {review.conditionTags.length > 0 && (
                        <div className="d-flex flex-wrap gap-1 my-1">
                          {review.conditionTags.map((tag) => (
                            <span key={tag} className="badge bg-light text-dark border">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {review.comment && (
                        <p className="small text-secondary mb-1 mt-1">{review.comment}</p>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger text-decoration-none p-0"
                        style={{ fontSize: '0.75rem' }}
                        disabled={isPending}
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        Delete review
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* My Quick Condition Reports */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h6 fw-bold text-dark mb-0">My Quick Reports</h2>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold"
                  style={{ color: '#0d9488' }}
                  onClick={() => openReportForBathroom()}
                  disabled={data.bathrooms.length === 0}
                >
                  + Post
                </button>
              </div>

              {data.reports.length === 0 ? (
                <p className="text-muted small mb-0">No condition reports posted yet.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {data.reports.map((report) => (
                    <li key={report.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-semibold text-dark small">{report.bathroomLabel}</span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {report.createdAt}
                        </span>
                      </div>
                      <span className="badge bg-light text-dark border my-1">
                        {report.condition}
                      </span>
                      {report.note && <p className="small text-secondary mb-1">{report.note}</p>}
                      <div>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger text-decoration-none p-0"
                          style={{ fontSize: '0.75rem' }}
                          disabled={isPending}
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          Remove report
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* My Bathroom Addition / Edit Requests */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h6 fw-bold text-dark mb-0">My Bathroom Requests</h2>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold"
                  style={{ color: '#0d9488' }}
                  onClick={() => {
                    handleRequestTypeSwitch('NEW_BATHROOM');
                    setShowRequestModal(true);
                  }}
                >
                  + Request
                </button>
              </div>

              {data.requests.length === 0 ? (
                <p className="text-muted small mb-0">
                  No new bathroom proposals or correction requests submitted yet.
                </p>
              ) : (
                <ul className="list-group list-group-flush">
                  {data.requests.map((req) => (
                    <li key={req.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-center gap-2">
                        <span className="fw-semibold text-dark small">{req.bathroomLabel}</span>
                        <span className={`badge ${statusBadgeClass(req.status)}`}>
                          {req.status}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="badge bg-secondary-subtle text-secondary-emphasis me-1">
                          {req.requestType === 'NEW_BATHROOM' ? 'New Location' : 'Correction'}
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {req.createdAt}
                        </span>
                      </div>
                      <p className="small text-secondary mb-0 mt-1">{req.details}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: QUICK CONDITION REPORT */}
      {showReportModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}
        >
          <div className="card border-0 shadow-lg w-100" style={{ maxWidth: '480px' }}>
            <div
              className="card-header text-white d-flex justify-content-between align-items-center py-3"
              style={{ backgroundColor: '#0d9488' }}
            >
              <h3 className="h6 fw-bold mb-0">
                <i className="fa-solid fa-bolt me-2" />
                Submit Quick Condition Report
              </h3>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowReportModal(false)}
              />
            </div>
            <form onSubmit={handleReportSubmit}>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small fw-bold">Campus Restroom</label>
                  <select
                    className="form-select"
                    value={reportBathroomId}
                    onChange={(e) => setReportBathroomId(Number(e.target.value))}
                    required
                  >
                    {data.bathrooms.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Current Condition</label>
                  <div className="d-flex flex-wrap gap-2">
                    {QUICK_CONDITIONS.map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        className={`btn btn-sm ${
                          reportCondition === cond ? 'text-white fw-semibold' : 'btn-outline-secondary'
                        }`}
                        style={
                          reportCondition === cond
                            ? { backgroundColor: '#0d9488', borderColor: '#0d9488' }
                            : undefined
                        }
                        onClick={() => setReportCondition(cond)}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-0">
                  <label className="form-label small fw-bold">Optional Note</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="e.g., Left soap dispenser is empty, paper towels restocked."
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="card-footer bg-light d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn text-white fw-semibold"
                  style={{ backgroundColor: '#0d9488' }}
                  disabled={isPending}
                >
                  {isPending ? 'Posting...' : 'Post Live Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WRITE 5-STAR REVIEW */}
      {showReviewModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}
        >
          <div className="card border-0 shadow-lg w-100" style={{ maxWidth: '520px' }}>
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-3">
              <h3 className="h6 fw-bold mb-0">
                <i className="fa-solid fa-star text-warning me-2" />
                Write Restroom Review
              </h3>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowReviewModal(false)}
              />
            </div>
            <form onSubmit={handleReviewSubmit}>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small fw-bold">Campus Restroom</label>
                  <select
                    className="form-select"
                    value={reviewBathroomId}
                    onChange={(e) => setReviewBathroomId(Number(e.target.value))}
                    required
                  >
                    {data.bathrooms.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-4">
                    <label className="form-label small fw-bold">Overall (1–5)</label>
                    <select
                      className="form-select"
                      value={overallScore}
                      onChange={(e) => setOverallScore(Number(e.target.value))}
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} ★
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-4">
                    <label className="form-label small fw-bold">Cleanliness (1–5)</label>
                    <select
                      className="form-select"
                      value={cleanliness}
                      onChange={(e) => setCleanliness(Number(e.target.value))}
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} / 5
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-4">
                    <label className="form-label small fw-bold">Freshness/Odor (1–5)</label>
                    <select
                      className="form-select"
                      value={odor}
                      onChange={(e) => setOdor(Number(e.target.value))}
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} / 5
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Tags</label>
                  <div className="d-flex flex-wrap gap-2">
                    {CONDITION_TAGS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={`btn btn-sm ${
                            active ? 'btn-dark' : 'btn-outline-secondary'
                          }`}
                          onClick={() =>
                            setSelectedTags((prev) =>
                              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                            )
                          }
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-0">
                  <label className="form-label small fw-bold">Written Review</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Share details about cleanliness, stall availability, or supplies..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>
              </div>
              <div className="card-footer bg-light d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn text-white fw-semibold"
                  style={{ backgroundColor: '#0d9488' }}
                  disabled={isPending}
                >
                  {isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PROPOSE NEW BATHROOM OR CORRECTION */}
      {showRequestModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 overflow-auto"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}
        >
          <div className="card border-0 shadow-lg w-100 my-auto" style={{ maxWidth: '580px' }}>
            <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-3">
              <h3 className="h6 fw-bold mb-0">
                <i className="fa-solid fa-pen-to-square me-2" />
                Submit Restroom Proposal or Correction
              </h3>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowRequestModal(false)}
              />
            </div>

            <form onSubmit={handleRequestSubmit}>
              <div className="card-body">
                {/* Toggle Request Mode */}
                <div className="btn-group w-100 mb-3" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      requestType === 'NEW_BATHROOM' ? 'btn-dark' : 'btn-outline-secondary'
                    }`}
                    onClick={() => handleRequestTypeSwitch('NEW_BATHROOM')}
                  >
                    Propose New Bathroom
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      requestType === 'CORRECTION' ? 'btn-dark' : 'btn-outline-secondary'
                    }`}
                    disabled={data.bathrooms.length === 0}
                    onClick={() => handleRequestTypeSwitch('CORRECTION')}
                  >
                    Suggest Static Correction
                  </button>
                </div>

                {requestType === 'CORRECTION' && data.bathrooms.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Existing Restroom to Correct</label>
                    <select
                      className="form-select"
                      value={targetBathroomId}
                      onChange={(e) => handleTargetBathroomChange(Number(e.target.value))}
                    >
                      {data.bathrooms.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Building Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Hamilton Library"
                      value={reqBuilding}
                      onChange={(e) => setReqBuilding(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Floor *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., 2"
                      value={reqFloor}
                      onChange={(e) => setReqFloor(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Room #</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., 204"
                      value={reqRoomNumber}
                      onChange={(e) => setReqRoomNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Restroom Type</label>
                    <select
                      className="form-select"
                      value={reqType}
                      onChange={(e) => setReqType(e.target.value)}
                    >
                      <option value="Multi-Stall (Men & Women)">Multi-Stall (Men & Women)</option>
                      <option value="Single-Occupancy All-Gender">Single-Occupancy All-Gender</option>
                      <option value="Men's Multi-Stall">Men's Multi-Stall</option>
                      <option value="Women's Multi-Stall">Women's Multi-Stall</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Stall Count</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      className="form-control"
                      value={reqStallCount}
                      onChange={(e) => setReqStallCount(Number(e.target.value))}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold">Renovated Year</label>
                    <input
                      type="number"
                      min={1950}
                      max={2030}
                      className="form-control"
                      placeholder="e.g., 2022"
                      value={reqLastRenovated}
                      onChange={(e) => setReqLastRenovated(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-check mb-3">
                  <input
                    id="req-accessible"
                    type="checkbox"
                    className="form-check-input"
                    checked={reqAccessible}
                    onChange={(e) => setReqAccessible(e.target.checked)}
                  />
                  <label htmlFor="req-accessible" className="form-check-label small fw-semibold">
                    ADA Wheelchair Accessible
                  </label>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Amenities</label>
                  <div className="d-flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map((amenity) => {
                      const active = reqAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          className={`btn btn-sm ${
                            active ? 'btn-dark' : 'btn-outline-secondary'
                          }`}
                          onClick={() =>
                            setReqAmenities((prev) =>
                              prev.includes(amenity)
                                ? prev.filter((a) => a !== amenity)
                                : [...prev, amenity],
                            )
                          }
                        >
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-0">
                  <label className="form-label small fw-bold">Notes / Location Details</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="e.g., Located near the north stairwell; updated stall count from 2 to 4."
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="card-footer bg-light d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn text-white fw-semibold"
                  style={{ backgroundColor: '#0d9488' }}
                  disabled={isPending}
                >
                  {isPending ? 'Submitting...' : 'Submit for Admin Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}