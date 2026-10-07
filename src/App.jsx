import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const statuses = ['To apply', 'Applied', 'Interview', 'Offer', 'Rejected'];

const statusStyles = {
    'To apply': 'todo',
    Applied: 'applied',
    Interview: 'interview',
    Offer: 'offer',
    Rejected: 'rejected',
};

const formatDate = (date) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
        new Date(`${date}T12:00:00`),
    );

async function apiRequest(path, options = {}) {
    const response = await fetch(`/api${path}`, {
        credentials: 'same-origin',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    const data = response.status === 204 ? null : await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(data?.message || 'The request could not be completed. Please try again.');
        error.status = response.status;
        throw error;
    }

    return data;
}

function Icon({ name, size = 18 }) {
    const paths = {
        search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></>,
        plus: <><path d="M12 5v14M5 12h14" /></>,
        briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
        chat: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
        trend: <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
        arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
        logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
        close: <><path d="m18 6-12 12M6 6l12 12" /></>,
        trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
        chevron: <path d="m7 10 5 5 5-5" />,
    };

    return (
        <svg
            aria-hidden="true"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {paths[name]}
        </svg>
    );
}

function AuthScreen({ onAuthenticated, initialError = '' }) {
    const [mode, setMode] = useState('login');
    const [error, setError] = useState(initialError);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);
        const formData = new FormData(event.currentTarget);
        const payload = {
            email: formData.get('email').trim(),
            password: formData.get('password'),
        };

        if (mode === 'signup') payload.name = formData.get('name').trim();

        try {
            await onAuthenticated(mode, payload);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-screen">
            <section className="auth-card">
                <a className="brand auth-brand" href="#top" aria-label="Nextstep home">
                    <span className="brand-icon"><Icon name="trend" size={19} /></span>
                    <span>nextstep<span className="brand-period">.</span></span>
                </a>
                <div className="section-eyebrow"><span /> YOUR JOB SEARCH, IN ONE PLACE</div>
                <h1>{mode === 'login' ? 'Welcome back.' : 'Make your next move.'}</h1>
                <p className="auth-description">
                    {mode === 'login'
                        ? 'Sign in to pick up where you left off.'
                        : 'Create an account to keep your opportunities organized.'}
                </p>
                <form className="application-form auth-form" onSubmit={handleSubmit}>
                    {mode === 'signup' && (
                        <label>
                            <span>Your name</span>
                            <input name="name" autoComplete="name" maxLength="80" placeholder="e.g. Alex Morgan" required />
                        </label>
                    )}
                    <label>
                        <span>Email address</span>
                        <input name="email" type="email" autoComplete="email" maxLength="254" placeholder="you@example.com" required />
                    </label>
                    <label>
                        <span>Password</span>
                        <input
                            name="password"
                            type="password"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            minLength="8"
                            maxLength="72"
                            placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                            required
                        />
                    </label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <button type="submit" className="primary-button auth-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
                    </button>
                </form>
                <p className="auth-switch">
                    {mode === 'login' ? 'New to Nextstep?' : 'Already have an account?'}{' '}
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'login' ? 'signup' : 'login');
                            setError('');
                        }}
                    >
                        {mode === 'login' ? 'Create an account' : 'Sign in'}
                    </button>
                </p>
                <p className="auth-privacy">Your account and applications are stored securely in the database.</p>
            </section>
        </main>
    );
}

function App() {
    const [applications, setApplications] = useState([]);
    const [user, setUser] = useState(null);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [sessionError, setSessionError] = useState('');
    const [requestMessage, setRequestMessage] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All applications');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [applicationToDelete, setApplicationToDelete] = useState(null);
    const [formError, setFormError] = useState('');
    const companyInputRef = useRef(null);

    useEffect(() => {
        let isActive = true;
        apiRequest('/auth/me')
            .then(async ({ user: currentUser }) => {
                const { applications: savedApplications } = await apiRequest('/applications');
                if (!isActive) return;
                setUser(currentUser);
                setApplications(savedApplications);
            })
            .catch((error) => {
                if (!isActive) return;
                if (error.status !== 401) {
                    setSessionError(error.message);
                }
            })
            .finally(() => {
                if (isActive) setIsCheckingSession(false);
            });

        return () => {
            isActive = false;
        };
    }, []);

    const handleAuthenticated = async (mode, payload) => {
        await apiRequest(`/auth/${mode}`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        const { user: currentUser } = await apiRequest('/auth/me');
        const { applications: savedApplications } = await apiRequest('/applications');
        setUser(currentUser);
        setApplications(savedApplications);
        setSessionError('');
    };

    const handleLogout = async () => {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
            setUser(null);
            setApplications([]);
            setSearch('');
            setStatusFilter('All applications');
            setRequestMessage('');
        } catch (error) {
            setRequestMessage(error.message);
        }
    };

    useEffect(() => {
        if (isFormOpen) companyInputRef.current?.focus();
    }, [isFormOpen]);

    const stats = useMemo(() => ({
        total: applications.length,
        inProgress: applications.filter(({ status }) =>
            ['Applied', 'Interview'].includes(status),
        ).length,
        interviews: applications.filter(({ status }) => status === 'Interview').length,
        offers: applications.filter(({ status }) => status === 'Offer').length,
    }), [applications]);

    const filteredApplications = useMemo(() => {
        const query = search.trim().toLowerCase();
        return applications
            .filter((application) =>
                statusFilter === 'All applications' || application.status === statusFilter,
            )
            .filter((application) => {
                if (!query) return true;
                return `${application.company} ${application.role} ${application.location}`
                    .toLowerCase()
                    .includes(query);
            })
            .sort((first, second) => second.createdAt - first.createdAt);
    }, [applications, search, statusFilter]);

    const handleAddApplication = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const company = formData.get('company').trim();
        const role = formData.get('role').trim();
        const form = event.currentTarget;

        if (!company || !role) {
            setFormError('Add a company and role to save this application.');
            return;
        }

        try {
            const { application } = await apiRequest('/applications', {
                method: 'POST',
                body: JSON.stringify({
                    company,
                    role,
                    location: formData.get('location').trim(),
                    date: formData.get('date'),
                    status: formData.get('status'),
                }),
            });
            setApplications((current) => [application, ...current]);
            setFormError('');
            setRequestMessage('');
            setIsFormOpen(false);
            form.reset();
        } catch (error) {
            setFormError(error.message);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const { application } = await apiRequest(`/applications/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            setApplications((current) => current.map((item) => item.id === id ? application : item));
            setRequestMessage('');
        } catch (error) {
            setRequestMessage(error.message);
        }
    };

    const confirmDeleteApplication = async () => {
        if (!applicationToDelete) return;
        try {
            await apiRequest(`/applications/${applicationToDelete.id}`, { method: 'DELETE' });
            setApplications((current) => current.filter((application) => application.id !== applicationToDelete.id));
            setApplicationToDelete(null);
            setRequestMessage('');
        } catch (error) {
            setRequestMessage(error.message);
        }
    };

    if (isCheckingSession) {
        return <main className="auth-screen"><p className="auth-loading">Loading your workspace…</p></main>;
    }

    if (!user) return <AuthScreen onAuthenticated={handleAuthenticated} initialError={sessionError} />;

    const initials = user.name.trim().charAt(0).toUpperCase();

    const today = new Intl.DateTimeFormat('en', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).format(new Date());

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <a className="brand" href="#top" aria-label="Nextstep home">
                    <span className="brand-icon"><Icon name="trend" size={19} /></span>
                    <span>nextstep<span className="brand-period">.</span></span>
                </a>

                <div className="sidebar-label">WORKSPACE</div>
                <nav className="side-nav" aria-label="Workspace">
                    <a className="side-link active" href="#applications">
                        <Icon name="briefcase" size={17} />
                        <span>Applications</span>
                        <span className="nav-count">{stats.total}</span>
                    </a>
                    <a className="side-link" href="#overview">
                        <Icon name="trend" size={17} />
                        <span>Overview</span>
                    </a>
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-tip">
                        <span className="tip-spark">✳</span>
                        <h3>Small steps<br />add up.</h3>
                        <p>Keep your momentum. You’re doing better than you think.</p>
                    </div>
                    <div className="profile">
                        <div className="profile-avatar">{initials}</div>
                        <div className="profile-copy">
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="main-content" id="top">
                <header className="topbar">
                    <div className="breadcrumb"><span>Workspace</span><span>/</span><strong>Applications</strong></div>
                    <div className="topbar-right">
                        <span className={`save-status${requestMessage ? ' save-error' : ''}`}>
                            <i /> {requestMessage ? 'Sync issue' : 'Synced to database'}
                        </span>
                        <span className="top-avatar">{initials}</span>
                        <button className="top-logout" onClick={handleLogout} title="Sign out" aria-label="Sign out">
                            <Icon name="logout" size={15} /><span>Sign out</span>
                        </button>
                    </div>
                </header>

                <div className="page-content">
                    <section className="welcome-row" id="overview">
                        <div>
                            <div className="date-label">{today}</div>
                            <h1>Your next chapter<br className="mobile-break" /> starts here<span>.</span></h1>
                            <p className="welcome-subtitle">A little clarity for the road ahead.</p>
                        </div>
                        <button className="primary-button" onClick={() => setIsFormOpen(true)}>
                            <Icon name="plus" size={16} /> Add application
                        </button>
                    </section>

                    {requestMessage && <p className="storage-message" role="status">{requestMessage}</p>}

                    <section className="stats-grid" aria-label="Application statistics">
                        <article className="stat-card">
                            <div className="stat-top"><span>Total applications</span><span className="stat-icon icon-green"><Icon name="briefcase" size={16} /></span></div>
                            <strong>{stats.total}</strong>
                            <span className="stat-caption">opportunities tracked</span>
                        </article>
                        <article className="stat-card">
                            <div className="stat-top"><span>In progress</span><span className="stat-icon icon-blue"><Icon name="trend" size={16} /></span></div>
                            <strong>{stats.inProgress}</strong>
                            <span className="stat-caption">applications in motion</span>
                        </article>
                        <article className="stat-card">
                            <div className="stat-top"><span>Interviews</span><span className="stat-icon icon-amber"><Icon name="calendar" size={16} /></span></div>
                            <strong>{stats.interviews}</strong>
                            <span className="stat-caption">conversations ahead</span>
                        </article>
                        <article className="stat-card">
                            <div className="stat-top"><span>Offers</span><span className="stat-icon icon-lilac"><Icon name="chat" size={16} /></span></div>
                            <strong>{stats.offers}</strong>
                            <span className="stat-caption">new beginnings</span>
                        </article>
                    </section>

                    <section className="applications-section" id="applications">
                        <div className="section-top">
                            <div>
                                <div className="section-eyebrow"><span /> YOUR JOB SEARCH</div>
                                <h2>Applications <span>{stats.total}</span></h2>
                            </div>
                            <button className="secondary-button" onClick={() => setIsFormOpen(true)}>
                                <Icon name="plus" size={15} /> New application
                            </button>
                        </div>

                        <div className="toolbar">
                            <label className="search-box">
                                <Icon name="search" size={16} />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search company or role..."
                                    aria-label="Search applications"
                                />
                                <kbd>/</kbd>
                            </label>
                            <label className="filter-select">
                                <span className="sr-only">Filter by status</span>
                                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                                    <option>All applications</option>
                                    {statuses.map((status) => <option key={status}>{status}</option>)}
                                </select>
                                <Icon name="chevron" size={14} />
                            </label>
                        </div>

                        <div className="application-list">
                            <div className="list-header">
                                <span>COMPANY & ROLE</span>
                                <span>STATUS</span>
                                <span>DATE ADDED</span>
                                <span aria-label="Actions" />
                            </div>
                            {filteredApplications.length ? (
                                filteredApplications.map((application) => (
                                    <article className="application-row" key={application.id}>
                                        <div className="company-cell">
                                            <div className={`company-logo logo-${application.company.charCodeAt(0) % 5}`}>
                                                {application.company.trim().charAt(0).toUpperCase()}
                                            </div>
                                            <div className="company-details">
                                                <strong>{application.company}</strong>
                                                <span>{application.role}{application.location ? ` · ${application.location}` : ''}</span>
                                            </div>
                                        </div>
                                        <label className={`status-pill ${statusStyles[application.status]}`}>
                                            <span className="status-dot" />
                                            <span className="sr-only">Status: </span>
                                            <select
                                                value={application.status}
                                                onChange={(event) => updateStatus(application.id, event.target.value)}
                                                aria-label={`Status for ${application.role} at ${application.company}`}
                                            >
                                                {statuses.map((status) => <option key={status}>{status}</option>)}
                                            </select>
                                            <Icon name="chevron" size={12} />
                                        </label>
                                        <div className="date-cell">
                                            <Icon name="calendar" size={14} />
                                            <span>{formatDate(application.date)}</span>
                                        </div>
                                        <button
                                            className="delete-button"
                                            onClick={() => setApplicationToDelete(application)}
                                            aria-label={`Delete ${application.role} at ${application.company}`}
                                            title="Delete application"
                                        >
                                            <Icon name="trash" size={15} />
                                        </button>
                                    </article>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon"><Icon name={search || statusFilter !== 'All applications' ? 'search' : 'briefcase'} size={22} /></div>
                                    <h3>{search || statusFilter !== 'All applications' ? 'No matches found' : 'Your list starts here'}</h3>
                                    <p>
                                        {search || statusFilter !== 'All applications'
                                            ? 'Try a different search or status filter.'
                                            : 'Add your first opportunity and keep every next step in one place.'}
                                    </p>
                                    {!search && statusFilter === 'All applications' && (
                                        <button className="empty-add" onClick={() => setIsFormOpen(true)}>
                                            <Icon name="plus" size={15} /> Add your first application
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="list-footer">
                            <span>Showing <strong>{filteredApplications.length}</strong> of <strong>{stats.total}</strong> applications</span>
                            <span className="privacy-note"><span /> Private to your account</span>
                        </div>
                    </section>

                    <footer className="page-footer">
                        <span>One step at a time. You’ve got this.</span>
                        <span>MADE FOR THE IN-BETWEEN <i>✳</i></span>
                    </footer>
                </div>
            </main>

            {isFormOpen && (
                <div className="modal-backdrop" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setIsFormOpen(false);
                }}>
                    <section className="application-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                        <div className="modal-heading">
                            <div>
                                <div className="section-eyebrow"><span /> A NEW OPPORTUNITY</div>
                                <h2 id="modal-title">Add an application</h2>
                            </div>
                            <button className="close-button" onClick={() => setIsFormOpen(false)} aria-label="Close form">
                                <Icon name="close" size={18} />
                            </button>
                        </div>
                        <p className="modal-description">Capture the details now. You can update the status as things move forward.</p>
                        <form className="application-form" onSubmit={handleAddApplication}>
                            <label>
                                <span>Company <b>*</b></span>
                                <input ref={companyInputRef} name="company" placeholder="e.g. Acme Studio" required />
                            </label>
                            <label>
                                <span>Job title <b>*</b></span>
                                <input name="role" placeholder="e.g. Product Designer" required />
                            </label>
                            <div className="form-row">
                                <label>
                                    <span>Location</span>
                                    <input name="location" placeholder="Remote, London..." />
                                </label>
                                <label>
                                    <span>Date added</span>
                                    <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                                </label>
                            </div>
                            <label>
                                <span>Current status</span>
                                <select name="status" defaultValue="To apply">
                                    {statuses.map((status) => <option key={status}>{status}</option>)}
                                </select>
                            </label>
                            {formError && <p className="form-error" role="alert">{formError}</p>}
                            <div className="modal-actions">
                                <button type="button" className="cancel-button" onClick={() => setIsFormOpen(false)}>Cancel</button>
                                <button type="submit" className="primary-button"><Icon name="plus" size={15} /> Save application</button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {applicationToDelete && (
                <div className="modal-backdrop" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setApplicationToDelete(null);
                }}>
                    <section className="application-modal confirmation-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
                        <div className="modal-heading">
                            <div>
                                <div className="section-eyebrow"><span /> CONFIRM ACTION</div>
                                <h2 id="delete-title">Delete this application?</h2>
                            </div>
                            <button className="close-button" onClick={() => setApplicationToDelete(null)} aria-label="Cancel deletion">
                                <Icon name="close" size={18} />
                            </button>
                        </div>
                        <p className="modal-description" id="delete-description">
                            This will permanently remove <strong>{applicationToDelete.role}</strong> at <strong>{applicationToDelete.company}</strong> from your tracker. This action can’t be undone.
                        </p>
                        <div className="modal-actions">
                            <button type="button" className="cancel-button" onClick={() => setApplicationToDelete(null)}>Keep application</button>
                            <button type="button" className="danger-button" onClick={confirmDeleteApplication}>
                                <Icon name="trash" size={15} /> Delete application
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

export default App;
