// src/app/dashboard/page.tsx
import Link from 'next/link';
import { getUserDashboardData } from '@/lib/dashboardData';

export default async function DashboardPage() {
  // Temporary dev user while your teammate builds sign-in.
  // Later, replace with your auth session email.
  const userEmail = 'john@foo.com';
  const data = await getUserDashboardData(userEmail);

  return (
    <main className="container py-4 flex-grow-1">
      {/* Header & Account Summary */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3 p-4">
          <div>
            <h1 className="h3 fw-bold text-dark mb-1">User Dashboard</h1>
            <p className="text-muted small mb-0">
              Signed in as <strong className="text-dark">{data.user.email}</strong>{' '}
              <span className="badge bg-secondary ms-1">{data.user.role}</span>
            </p>
          </div>

          {data.user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="btn text-white fw-semibold"
              style={{ backgroundColor: '#0d9488' }}
            >
              <i className="fa-solid fa-user-shield me-1" /> Open Admin Moderation Queue
            </Link>
          )}
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
        <h2 className="h5 fw-bold text-dark mb-3">
          <i className="fa-solid fa-heart text-danger me-2" />
          My Favorite Bathrooms
        </h2>
        <div className="row g-3">
          {data.favorites.map((bathroom) => (
            <div key={bathroom.id} className="col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h3 className="h6 fw-bold text-dark mb-1">
                        {bathroom.building} — Floor {bathroom.floor}
                        {bathroom.roomNumber ? ` (Room ${bathroom.roomNumber})` : ''}
                      </h3>
                      <p className="text-muted small mb-2">{bathroom.types.join(' • ')}</p>
                    </div>
                    <span className="badge bg-warning text-dark fs-6">
                      ★ {bathroom.overallRating.toFixed(1)}
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
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews, Quick Reports, and Bathroom Requests */}
      <div className="row g-3">
        {/* My Reviews */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h2 className="h6 fw-bold text-dark mb-3">My Reviews</h2>
              <ul className="list-group list-group-flush">
                {data.reviews.map((review) => (
                  <li key={review.id} className="list-group-item px-0">
                    <div className="fw-semibold text-dark small">
                      {review.bathroomLabel} — ★ {review.overallScore}/5
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Cleanliness: {review.cleanliness}/5 • Odor: {review.odor}/5
                    </div>
                    <p className="small text-secondary mb-0 mt-1">{review.comment}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* My Quick Condition Reports */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h2 className="h6 fw-bold text-dark mb-3">My Quick Reports</h2>
              <ul className="list-group list-group-flush">
                {data.reports.map((report) => (
                  <li key={report.id} className="list-group-item px-0">
                    <div className="fw-semibold text-dark small">{report.bathroomLabel}</div>
                    <span className="badge bg-light text-dark border my-1">
                      {report.condition}
                    </span>
                    {report.note && <p className="small text-secondary mb-1">{report.note}</p>}
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {report.createdAt}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* My Bathroom Addition / Edit Requests */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h2 className="h6 fw-bold text-dark mb-3">My Bathroom Requests</h2>
              <ul className="list-group list-group-flush">
                {data.requests.map((req) => (
                  <li key={req.id} className="list-group-item px-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold text-dark small">{req.bathroomLabel}</span>
                      <span className="badge bg-warning-subtle text-warning-emphasis">
                        {req.status}
                      </span>
                    </div>
                    <p className="small text-secondary mb-0 mt-1">{req.requestType}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}