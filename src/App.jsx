import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Activity, ArrowDownLeft, ArrowLeft, ArrowUpRight, CalendarDays, Check, ChevronRight,
  CircleAlert, ClipboardList, Clock3, HeartPulse, LayoutDashboard, LogOut, MapPin,
  PawPrint, Plus, Search, ShieldCheck, Stethoscope, UserRound, Users, X,
} from 'lucide-react'
import api, { errorMessage } from './api'

const statusLabels = {
  REPORTED: 'Reported', UNDER_REVIEW: 'Under review', ASSIGNED: 'Assigned',
  RESCUE_IN_PROGRESS: 'Rescue in progress', AT_CLINIC: 'At clinic',
  UNDER_TREATMENT: 'Under treatment', COMPLETED: 'Completed', CANCELLED: 'Cancelled', REJECTED: 'Rejected',
}

function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(Boolean(localStorage.getItem('vetvision-token')))
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('vetvision-token')
    if (!token) return
    api.get('/auth/me').then(({ data }) => setUser(data)).catch(() => {
      localStorage.removeItem('vetvision-token')
      setUser(null)
    }).finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    const signOut = () => setUser(null)
    window.addEventListener('vetvision:unauthorized', signOut)
    return () => window.removeEventListener('vetvision:unauthorized', signOut)
  }, [])

  const handleAuth = (auth) => {
    localStorage.setItem('vetvision-token', auth.token)
    setUser(auth.user)
  }
  const logout = () => {
    localStorage.removeItem('vetvision-token')
    setUser(null)
  }

  if (checking) return <div className="boot-screen"><PawPrint size={28} /><span>Opening Vetvision</span></div>
  if (!user) return <Routes>
    <Route path="/register" element={<AuthPage mode="register" onAuth={handleAuth} />} />
    <Route path="*" element={<AuthPage mode="login" onAuth={handleAuth} />} />
  </Routes>

  return <div className="app-shell">
    <Sidebar user={user} onLogout={logout} />
    <main className="main-area">
      <Topbar user={user} />
      <div className="page-wrap" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/report" element={<ReportCase />} />
          <Route path="/cases" element={<CasesPage user={user} />} />
          <Route path="/cases/:id" element={<CaseDetails user={user} />} />
          <Route path="/clinics" element={<ClinicsPage user={user} />} />
          <Route path="/appointments" element={<AppointmentsPage user={user} />} />
          <Route path="/treatments" element={<TreatmentsPage user={user} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </main>
  </div>
}

const links = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/cases', label: 'Rescue cases', icon: ClipboardList },
  { to: '/report', label: 'Report an animal', icon: Plus, rescuer: true },
  { to: '/clinics', label: 'Clinic directory', icon: Stethoscope },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/treatments', label: 'Treatment records', icon: HeartPulse },
]

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate()
  return <aside className="sidebar">
    <Link to="/" className="brand"><span className="brand-mark"><PawPrint size={20} /></span><span>vetvision<small>CARE NETWORK</small></span></Link>
    <div className="workspace-label">WORKSPACE</div>
    <nav className="side-nav">
      {links.filter((item) => !item.rescuer || user.role === 'RESCUER').map(({ to, label, icon: Icon }) =>
        <NavLink end={to === '/'} to={to} key={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{to === '/report' && <span className="nav-add">+</span>}
        </NavLink>)}
    </nav>
    <div className="sidebar-bottom">
      <div className="sidebar-note"><ShieldCheck size={16} /><span>Connected care, from first call to full recovery.</span></div>
      <button className="profile-mini" onClick={onLogout} title="Sign out">
        <span className="avatar">{user.firstName?.[0]}{user.lastName?.[0]}</span>
        <span className="profile-text"><strong>{user.firstName} {user.lastName}</strong><small>{roleName(user.role)}</small></span>
        <LogOut size={16} className="logout-icon" />
      </button>
    </div>
  </aside>
}

function Topbar({ user }) {
  const location = useLocation()
  const current = links.find((item) => item.to === location.pathname || location.pathname.startsWith(`${item.to}/`))
  return <header className="topbar">
    <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{current?.label || 'Overview'}</strong></div>
    <div className="topbar-right"><span className="secure-label"><span className="online-dot" /> Live workspace</span><span className="top-avatar">{user.firstName?.[0]}</span></div>
  </header>
}

function AuthPage({ mode, onAuth }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const register = mode === 'register'
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const { data } = await api.post(register ? '/auth/register' : '/auth/login', form)
      onAuth(data); navigate('/', { replace: true })
    } catch (requestError) { setError(errorMessage(requestError)) } finally { setBusy(false) }
  }
  return <div className="auth-screen">
    <div className="auth-art"><div className="art-top"><span className="brand-mark"><PawPrint size={20} /></span><span>vetvision</span></div>
      <div className="art-copy"><span className="eyebrow">ANIMAL CARE, CONNECTED</span><h1>Every rescue<br />starts with <i>someone.</i></h1>
        <p>A shared place for neighbors, rescue teams, and veterinary clinics to bring animals back to care.</p>
        <div className="art-stats"><span><strong>01</strong> Report a concern</span><span><strong>02</strong> Coordinate response</span><span><strong>03</strong> Follow recovery</span></div>
      </div>
      <div className="art-bottom"><span>Animal Healthcare & Veterinary Assistance</span><span>Built for the in-between moments.</span></div>
    </div>
    <div className="auth-panel"><form className="auth-form" onSubmit={submit}>
      <div className="mobile-brand"><span className="brand-mark"><PawPrint size={19} /></span>vetvision</div>
      <span className="eyebrow">{register ? 'JOIN THE CARE NETWORK' : 'WELCOME BACK'}</span>
      <h2>{register ? 'Create your account' : 'Good to see you.'}</h2>
      <p className="muted">{register ? 'Register as a rescuer to report and track cases.' : 'Sign in to continue coordinating care.'}</p>
      {register && <div className="form-row"><Field label="First name" value={form.firstName} onChange={(value) => setForm({ ...form, firstName: value })} required /><Field label="Last name" value={form.lastName} onChange={(value) => setForm({ ...form, lastName: value })} required /></div>}
      <Field label="Email address" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
      <Field label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required minLength={register ? 10 : undefined} />
      {error && <ErrorBanner message={error} />}
      <button className="button primary full" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}<ArrowUpRight size={16} /></button>
      <p className="auth-switch">{register ? 'Already have an account?' : 'New to Vetvision?'} <Link to={register ? '/' : '/register'}>{register ? 'Sign in' : 'Create a rescuer account'}</Link></p>
      <p className="small-note"><ShieldCheck size={14} /> Organization and clinic access is provisioned by an administrator.</p>
    </form></div>
  </div>
}

function Dashboard({ user }) {
  const [stats, setStats] = useState(null)
  const [cases, setCases] = useState([])
  const [appointments, setAppointments] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { Promise.all([api.get('/dashboard'), api.get('/cases'), api.get('/appointments')]).then(([a, c, p]) => {
    setStats(a.data); setCases(c.data); setAppointments(p.data)
  }).catch((e) => setError(errorMessage(e))) }, [])
  return <>
    <PageHeading eyebrow={`GOOD ${greeting()}, ${user.firstName?.toUpperCase()}`} title="Care, coordinated." subtitle="A clear view of every case moving through your network."
      action={user.role === 'RESCUER' && <Link className="button primary" to="/report"><Plus size={17} /> New report</Link>} />
    {error && <ErrorBanner message={error} />}
    <div className="stat-grid">
      <Stat icon={ClipboardList} label="Total cases" value={stats?.totalCases} tone="green" foot="In your care network" />
      <Stat icon={Activity} label="Active cases" value={stats?.active} tone="teal" foot="Currently in progress" />
      <Stat icon={Clock3} label="Under treatment" value={stats?.underTreatment} tone="amber" foot="At a veterinary clinic" />
      <Stat icon={CalendarDays} label="Upcoming visits" value={stats?.upcomingAppointments} tone="coral" foot="Scheduled appointments" />
    </div>
    <div className="dashboard-grid">
      <section className="panel case-panel"><div className="panel-heading"><div><span className="eyebrow">LIVE TRACKING</span><h3>Recent cases</h3></div><Link className="text-link" to="/cases">All cases <ArrowUpRight size={15} /></Link></div>
        {cases.length ? <div className="case-list">{cases.slice(0, 5).map((item) => <Link to={`/cases/${item.id}`} className="case-row" key={item.id}>
          <span className="animal-icon"><PawPrint size={17} /></span><span className="case-main"><strong>{item.animalType}{item.breed ? ` · ${item.breed}` : ''}</strong><small>{item.caseId} <span>·</span> {item.location}</small></span><StatusBadge value={item.status} /><ChevronRight size={16} className="row-arrow" />
        </Link>)}</div> : <EmptyState icon={PawPrint} title="No cases yet" detail="New reports will appear here as they enter the network." />}
      </section>
      <section className="panel appointment-panel"><div className="panel-heading"><div><span className="eyebrow">ON THE CALENDAR</span><h3>Next appointments</h3></div><Link className="icon-link" to="/appointments" aria-label="View appointments"><ArrowUpRight size={17} /></Link></div>
        {appointments.filter((a) => a.status !== 'CANCELLED').slice(0, 4).length ? <div className="appointment-list">{appointments.filter((a) => a.status !== 'CANCELLED').slice(0, 4).map((item) => <div className="appointment-row" key={item.id}><div className="date-tile"><b>{new Date(item.appointmentDateTime).getDate()}</b><small>{new Date(item.appointmentDateTime).toLocaleString(undefined, { month: 'short' })}</small></div><div><strong>{item.clinicName}</strong><small>{item.caseId} · {new Date(item.appointmentDateTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small></div></div>)}</div> : <EmptyState icon={CalendarDays} title="Nothing scheduled" detail="Appointments booked for a case show here." />}
        <div className="mini-summary"><div className="summary-icon"><Users size={17} /></div><div><strong>{user.role === 'ORGANIZATION' ? 'Coordination desk' : user.role === 'CLINIC' ? 'Clinic workspace' : 'Rescuer workspace'}</strong><small>{roleName(user.role)} access · case data is private</small></div></div>
      </section>
    </div>
  </>
}

function ReportCase() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ animalType: '', breed: '', description: '', symptoms: '', location: '', urgency: 'MEDIUM' })
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try { const { data } = await api.post('/cases', form); navigate(`/cases/${data.id}`, { state: { notice: 'Your report has been received.' } }) }
    catch (e) { setError(errorMessage(e)) } finally { setBusy(false) }
  }
  return <>
    <PageHeading eyebrow="RESCUE INTAKE" title="Report an animal" subtitle="Share what you know. A coordinator can route the case to the right care team." />
    <div className="form-layout"><form className="panel form-panel" onSubmit={submit}>
      {error && <ErrorBanner message={error} />}
      <div className="form-section"><div className="section-number">01</div><div className="section-body"><h3>Animal & condition</h3><p>Start with what you can observe.</p>
        <div className="form-row"><Field label="Animal type" value={form.animalType} onChange={(value) => setForm({ ...form, animalType: value })} placeholder="e.g. Dog, cat, bird" required /><Field label="Breed, if known" value={form.breed} onChange={(value) => setForm({ ...form, breed: value })} placeholder="Optional" /></div>
        <Field label="What happened?" as="textarea" value={form.description} onChange={(value) => setForm({ ...form, description: value })} placeholder="Describe the animal's condition and what you observed…" required maxLength={2000} />
        <Field label="Symptoms or visible injuries" as="textarea" value={form.symptoms} onChange={(value) => setForm({ ...form, symptoms: value })} placeholder="Any signs that may help the response team" />
      </div></div>
      <div className="form-section"><div className="section-number">02</div><div className="section-body"><h3>Where to find them</h3><p>A clear location helps the team respond quickly.</p>
        <Field label="Location or address" value={form.location} onChange={(value) => setForm({ ...form, location: value })} placeholder="Street, landmark, neighborhood" required />
        <label className="field"><span>Urgency</span><select value={form.urgency} onChange={(event) => setForm({ ...form, urgency: event.target.value })}><option value="LOW">Low · Stable, needs attention</option><option value="MEDIUM">Medium · Needs prompt care</option><option value="HIGH">High · Serious injury or distress</option><option value="CRITICAL">Critical · Immediate danger</option></select></label>
      </div></div>
      <div className="form-actions"><span><ShieldCheck size={15} /> Your contact is shared only with authorized care teams.</span><button className="button primary" disabled={busy}>{busy ? 'Sending report…' : 'Submit report'}<ArrowUpRight size={16} /></button></div>
    </form><aside className="form-aside"><div className="aside-art"><PawPrint size={28} /><div className="aside-rings" /></div><span className="eyebrow">AFTER YOU SUBMIT</span><h3>One report, a connected response.</h3><p>Your case is saved to the care network and appears in your case tracker. An organization can review it and coordinate with a clinic.</p><div className="timeline-mini"><span><i /> Report received</span><span><i /> Rescue coordination</span><span><i /> Veterinary treatment</span><span><i /> Recovery follow-up</span></div></aside></div>
  </>
}

function CasesPage({ user }) {
  const [items, setItems] = useState([]); const [query, setQuery] = useState(''); const [status, setStatus] = useState('ALL'); const [error, setError] = useState('')
  useEffect(() => { api.get('/cases').then(({ data }) => setItems(data)).catch((e) => setError(errorMessage(e))) }, [])
  const filtered = items.filter((item) => (status === 'ALL' || item.status === status) && `${item.caseId} ${item.animalType} ${item.location}`.toLowerCase().includes(query.toLowerCase()))
  return <><PageHeading eyebrow="CASE TRACKER" title="Rescue cases" subtitle={`${items.length} ${items.length === 1 ? 'case' : 'cases'} visible to your account.`} action={user.role === 'RESCUER' && <Link to="/report" className="button primary"><Plus size={16} /> New report</Link>} />
    {error && <ErrorBanner message={error} />}
    <section className="panel table-panel"><div className="table-tools"><label className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cases or locations" /></label><select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="ALL">All statuses</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><span className="result-count">{filtered.length} results</span></div>
      {filtered.length ? <div className="table-scroll"><table><thead><tr><th>CASE</th><th>ANIMAL</th><th>LOCATION</th><th>URGENCY</th><th>STATUS</th><th>REPORTED</th><th></th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><Link to={`/cases/${item.id}`} className="case-id">{item.caseId}</Link></td><td><strong>{item.animalType}</strong>{item.breed && <small className="table-sub">{item.breed}</small>}</td><td><span className="location-cell"><MapPin size={13} />{item.location}</span></td><td><Urgency value={item.urgency} /></td><td><StatusBadge value={item.status} /></td><td>{new Date(item.reportedAt).toLocaleDateString()}</td><td><Link to={`/cases/${item.id}`} className="table-open" aria-label={`Open ${item.caseId}`}><ChevronRight size={16} /></Link></td></tr>)}</tbody></table></div> : <EmptyState icon={ClipboardList} title="No matching cases" detail={items.length ? 'Try changing the search or status filter.' : 'Reports visible to your role will show here.'} />}
    </section>
  </>
}

function CaseDetails({ user }) {
  const { id } = useParams(); const navigate = useNavigate(); const location = useLocation()
  const [item, setItem] = useState(null); const [treatments, setTreatments] = useState([]); const [clinics, setClinics] = useState([]); const [error, setError] = useState(''); const [notice, setNotice] = useState(location.state?.notice || '')
  useEffect(() => { Promise.all([api.get(`/cases/${id}`), api.get(`/cases/${id}/treatments`)]).then(([a, t]) => { setItem(a.data); setTreatments(t.data) }).catch((e) => setError(errorMessage(e))) }, [id])
  useEffect(() => { if (user.role === 'ORGANIZATION') api.get('/clinics').then(({ data }) => setClinics(data)).catch(() => {}) }, [user.role])
  async function changeStatus(status) { try { const { data } = await api.patch(`/cases/${id}/status`, { status }); setItem(data); setNotice('Case status updated.') } catch (e) { setError(errorMessage(e)) } }
  async function assign(clinicId) { try { const { data } = await api.put(`/cases/${id}/assignment?clinicId=${clinicId}`); setItem(data); setNotice('Clinic assigned to the case.') } catch (e) { setError(errorMessage(e)) } }
  if (!item && !error) return <Loading />
  const isClinic = user.role === 'CLINIC'; const canUpdate = user.role === 'ORGANIZATION' || isClinic
  return <>
    <button className="back-link" onClick={() => navigate('/cases')}><ArrowLeft size={16} /> All cases</button>
    {error && <ErrorBanner message={error} />}{notice && <div className="success-banner"><Check size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
    {item && <><PageHeading eyebrow={`${item.caseId} · REPORTED ${new Date(item.reportedAt).toLocaleDateString()}`} title={`${item.animalType}${item.breed ? ` · ${item.breed}` : ''}`} subtitle={`Reported by ${item.reporterName} · ${item.location}`} action={<StatusBadge value={item.status} />} />
      <div className="detail-grid"><div className="detail-main"><section className="panel detail-card"><div className="panel-heading"><div><span className="eyebrow">CASE NOTES</span><h3>Condition report</h3></div><Urgency value={item.urgency} /></div><p className="detail-copy">{item.description}</p>{item.symptoms && <div className="symptom-note"><CircleAlert size={17} /><span><b>Symptoms / visible injuries</b><br />{item.symptoms}</span></div>}<div className="detail-meta"><span><MapPin size={15} />{item.location}</span><span><UserRound size={15} />{item.reporterName}</span></div></section>
        <section className="panel detail-card"><div className="panel-heading"><div><span className="eyebrow">CARE HISTORY</span><h3>Treatment records</h3></div>{user.role === 'CLINIC' && <Link to={`/treatments?caseId=${item.id}`} className="text-link">Add record <Plus size={15} /></Link>}</div>
          {treatments.length ? treatments.map((t) => <div className="treatment-entry" key={t.id}><div className="treatment-date">{new Date(`${t.treatmentDate}T00:00:00`).toLocaleDateString()}</div><div><strong>{t.diagnosis}</strong><p>{t.treatment}</p>{t.careInstructions && <small>{t.careInstructions}</small>}<span>{t.clinicName} · {t.veterinarianName}</span></div></div>) : <EmptyState icon={HeartPulse} title="No treatment updates" detail="Authorized clinic records will be shown here." />}
        </section></div>
        <aside className="detail-side"><section className="panel side-card"><span className="eyebrow">CARE COORDINATION</span><h3>Assigned clinic</h3>{item.clinicName ? <div className="assigned-clinic"><span className="clinic-stamp"><Stethoscope size={18} /></span><div><strong>{item.clinicName}</strong><small>Responsible care provider</small></div></div> : <p className="muted">No clinic has been assigned yet.</p>}
          {user.role === 'ORGANIZATION' && <label className="field"><span>Assign a clinic</span><select value={item.clinicId || ''} onChange={(e) => e.target.value && assign(e.target.value)}><option value="">Choose clinic…</option>{clinics.map((clinic) => <option value={clinic.id} key={clinic.id}>{clinic.name}</option>)}</select></label>}
          {canUpdate && <label className="field status-control"><span>Update status</span><select value={item.status} onChange={(e) => changeStatus(e.target.value)}>{statusOptions(item.status, user.role).map((value) => <option value={value} key={value}>{statusLabels[value]}</option>)}</select></label>}
        </section><section className="side-callout"><Activity size={19} /><strong>Case progress</strong><span>Updates are visible to the reporting rescuer and the organization coordinating care.</span></section></aside>
      </div></>}
  </>
}

function ClinicsPage({ user }) {
  const [clinics, setClinics] = useState([]); const [query, setQuery] = useState(''); const [error, setError] = useState('')
  useEffect(() => { api.get('/clinics').then(({ data }) => setClinics(data)).catch((e) => setError(errorMessage(e))) }, [])
  const filtered = clinics.filter((c) => `${c.name} ${c.city} ${c.address} ${c.services || ''}`.toLowerCase().includes(query.toLowerCase()))
  return <><PageHeading eyebrow="VETERINARY NETWORK" title="Find a clinic" subtitle="Care providers available to your rescue network." action={user.role === 'ORGANIZATION' && <span className="eyebrow">CLINIC PROVISIONING VIA API</span>} />{error && <ErrorBanner message={error} />}
    <div className="directory-tools"><label className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, city, or service" /></label><span>{filtered.length} {filtered.length === 1 ? 'clinic' : 'clinics'}</span></div>
    {filtered.length ? <div className="clinic-grid">{filtered.map((clinic, index) => <article className="clinic-card" key={clinic.id}><div className={`clinic-top tone-${index % 3}`}><span className="clinic-stamp"><Stethoscope size={20} /></span><span className="clinic-number">VET · {String(index + 1).padStart(2, '0')}</span></div><div className="clinic-content"><h3>{clinic.name}</h3><p className="clinic-location"><MapPin size={14} />{clinic.address}, {clinic.city}</p>{clinic.services && <p className="clinic-services">{clinic.services}</p>}<div className="clinic-contact"><a href={`tel:${clinic.phone}`}>{clinic.phone}</a><span>{clinic.operatingHours || 'Hours not listed'}</span></div></div></article>)}</div> : <section className="panel"><EmptyState icon={Stethoscope} title="No clinics listed yet" detail="Clinic profiles added by your organization will be available here." /></section>}
  </>
}

function AppointmentsPage({ user }) {
  const [items, setItems] = useState([]); const [cases, setCases] = useState([]); const [clinics, setClinics] = useState([]); const [form, setForm] = useState({ caseId: '', clinicId: '', appointmentDateTime: '', notes: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const load = () => api.get('/appointments').then(({ data }) => setItems(data)).catch((e) => setError(errorMessage(e)))
  useEffect(() => { load(); api.get('/cases').then(({ data }) => setCases(data)); api.get('/clinics').then(({ data }) => setClinics(data)) }, [])
  async function book(event) { event.preventDefault(); setBusy(true); setError(''); try { await api.post('/appointments', { ...form, caseId: Number(form.caseId), clinicId: Number(form.clinicId), appointmentDateTime: form.appointmentDateTime }); setForm({ caseId: '', clinicId: '', appointmentDateTime: '', notes: '' }); await load() } catch (e) { setError(errorMessage(e)) } finally { setBusy(false) } }
  async function cancel(id) { try { await api.patch(`/appointments/${id}/status`, { status: 'CANCELLED' }); await load() } catch (e) { setError(errorMessage(e)) } }
  const canBook = user.role !== 'CLINIC'
  return <><PageHeading eyebrow="VETERINARY VISITS" title="Appointments" subtitle="Book and manage visits for cases in your care." />{error && <ErrorBanner message={error} />}
    {canBook && <form className="panel booking-panel" onSubmit={book}><div className="panel-heading"><div><span className="eyebrow">BOOK A VISIT</span><h3>Schedule with a clinic</h3></div><CalendarDays size={20} className="panel-icon" /></div>
      <div className="booking-fields"><label className="field"><span>Rescue case</span><select required value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value, clinicId: '' })}><option value="">Select a case…</option>{cases.map((c) => <option value={c.id} key={c.id}>{c.caseId} · {c.animalType}</option>)}</select></label><label className="field"><span>Assigned clinic</span><select required value={form.clinicId} onChange={(e) => setForm({ ...form, clinicId: e.target.value })}><option value="">Select a clinic…</option>{clinics.filter((c) => !cases.find((row) => String(row.id) === form.caseId)?.clinicId || cases.find((row) => String(row.id) === form.caseId)?.clinicId === c.id).map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label className="field"><span>Date & time</span><input type="datetime-local" required min={new Date().toISOString().slice(0, 16)} value={form.appointmentDateTime} onChange={(e) => setForm({ ...form, appointmentDateTime: e.target.value })} /></label></div>
      <div className="booking-footer"><Field label="Notes for clinic" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} placeholder="Optional details for the visit" /><button className="button primary" disabled={busy}>{busy ? 'Booking…' : 'Book appointment'}<ArrowUpRight size={16} /></button></div>
    </form>}
    <section className="panel table-panel appointments-table"><div className="panel-heading"><div><span className="eyebrow">SCHEDULE</span><h3>Visits</h3></div><span className="result-count">{items.length} total</span></div>
      {items.length ? <div className="table-scroll"><table><thead><tr><th>DATE & TIME</th><th>CASE</th><th>CLINIC</th><th>STATUS</th><th></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{new Date(item.appointmentDateTime).toLocaleDateString()}</strong><small className="table-sub">{new Date(item.appointmentDateTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small></td><td><span className="case-id">{item.caseId}</span><small className="table-sub">{item.animalType}</small></td><td>{item.clinicName}</td><td><StatusBadge value={item.status} /></td><td>{item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && user.role !== 'CLINIC' && <button className="small-action" onClick={() => cancel(item.id)}>Cancel</button>}</td></tr>)}</tbody></table></div> : <EmptyState icon={CalendarDays} title="No appointments yet" detail="Booked visits for your accessible cases appear here." />}
    </section>
  </>
}

function TreatmentsPage({ user }) {
  const queryCase = new URLSearchParams(window.location.search).get('caseId') || ''
  const [items, setItems] = useState([]); const [cases, setCases] = useState([]); const [caseId, setCaseId] = useState(queryCase); const [form, setForm] = useState({ diagnosis: '', treatment: '', careInstructions: '', treatmentDate: new Date().toISOString().slice(0, 10), followUpDate: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const load = (id) => id && api.get(`/cases/${id}/treatments`).then(({ data }) => setItems(data)).catch((e) => setError(errorMessage(e)))
  useEffect(() => { api.get('/cases').then(({ data }) => setCases(data)).catch((e) => setError(errorMessage(e))) }, [])
  useEffect(() => { setItems([]); load(caseId) }, [caseId])
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); try { await api.post('/treatments', { ...form, caseId: Number(caseId), followUpDate: form.followUpDate || null }); await load(caseId); setForm({ diagnosis: '', treatment: '', careInstructions: '', treatmentDate: new Date().toISOString().slice(0, 10), followUpDate: '' }) } catch (e) { setError(errorMessage(e)) } finally { setBusy(false) } }
  return <><PageHeading eyebrow="CLINICAL NOTES" title="Treatment records" subtitle="A case-linked history of care and follow-up instructions." />{error && <ErrorBanner message={error} />}
    <div className="treatments-layout"><section className="panel history-panel"><div className="panel-heading"><div><span className="eyebrow">CASE HISTORY</span><h3>Choose a case</h3></div></div><label className="field"><span>Rescue case</span><select value={caseId} onChange={(e) => setCaseId(e.target.value)}><option value="">Select a case…</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.caseId} · {c.animalType}</option>)}</select></label>
      {items.length ? <div className="history-list">{items.map((t) => <article className="history-entry" key={t.id}><span className="history-marker"><HeartPulse size={15} /></span><div><time>{new Date(`${t.treatmentDate}T00:00:00`).toLocaleDateString()}</time><h4>{t.diagnosis}</h4><p>{t.treatment}</p>{t.careInstructions && <small>{t.careInstructions}</small>}<span>{t.clinicName} · {t.veterinarianName}</span>{t.followUpDate && <span className="follow-up">Follow-up {new Date(`${t.followUpDate}T00:00:00`).toLocaleDateString()}</span>}</div></article>)}</div> : <EmptyState icon={HeartPulse} title={caseId ? 'No treatment yet' : 'Select a rescue case'} detail={caseId ? 'Clinical notes will appear here after the clinic records care.' : 'Treatment history is attached to an individual case.'} />}
    </section>
    {user.role === 'CLINIC' && <form className="panel treatment-form" onSubmit={submit}><div className="panel-heading"><div><span className="eyebrow">CLINIC WORKSPACE</span><h3>Add a treatment note</h3></div></div><Field label="Diagnosis" value={form.diagnosis} onChange={(value) => setForm({ ...form, diagnosis: value })} required /><Field label="Treatment provided" as="textarea" value={form.treatment} onChange={(value) => setForm({ ...form, treatment: value })} required /><Field label="Care instructions" as="textarea" value={form.careInstructions} onChange={(value) => setForm({ ...form, careInstructions: value })} /><div className="form-row"><Field label="Treatment date" type="date" value={form.treatmentDate} onChange={(value) => setForm({ ...form, treatmentDate: value })} required /><Field label="Follow-up date" type="date" value={form.followUpDate} onChange={(value) => setForm({ ...form, followUpDate: value })} /></div><button className="button primary full" disabled={!caseId || busy}>{busy ? 'Saving…' : 'Save treatment record'}<Check size={16} /></button></form>}
    </div>
  </>
}

function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action && <div className="heading-action">{action}</div>}</div>
}

function Field({ label, value, onChange, as = 'input', ...props }) {
  return <label className="field"><span>{label}</span>{as === 'textarea' ? <textarea value={value} onChange={(e) => onChange(e.target.value)} {...props} /> : <input value={value} onChange={(e) => onChange(e.target.value)} {...props} />}</label>
}

function Stat({ icon: Icon, label, value, tone, foot }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={18} /></span><span className="stat-label">{label}</span><strong className="stat-value">{value ?? <span className="loading-value" />}</strong><span className="stat-foot"><span className="online-dot" />{foot}</span></article>
}

function StatusBadge({ value }) {
  const tone = value === 'COMPLETED' || value === 'CONFIRMED' ? 'complete' : value === 'CANCELLED' || value === 'REJECTED' ? 'closed' : value === 'UNDER_TREATMENT' || value === 'AT_CLINIC' ? 'treatment' : value === 'HIGH' || value === 'CRITICAL' ? 'urgent' : 'open'
  return <span className={`status-badge ${tone}`}><i />{statusLabels[value] || value?.toLowerCase().replaceAll('_', ' ')}</span>
}

function Urgency({ value }) {
  return <span className={`urgency ${value?.toLowerCase()}`}><i />{value?.toLowerCase()}</span>
}

function EmptyState({ icon: Icon, title, detail }) {
  return <div className="empty-state"><span><Icon size={19} /></span><strong>{title}</strong><p>{detail}</p></div>
}

function ErrorBanner({ message }) { return <div className="error-banner"><CircleAlert size={16} /><span>{message}</span></div> }
function Loading() { return <div className="loading-block"><span className="spinner" />Loading case…</div> }
function NotFound() { return <div className="not-found"><span className="eyebrow">404 · NOT FOUND</span><h1>This page wandered off.</h1><Link to="/" className="button primary">Return to overview <ArrowLeft size={16} /></Link></div> }

function roleName(role) { return ({ RESCUER: 'Animal rescuer', CLINIC: 'Veterinary clinic', ORGANIZATION: 'Welfare organization' })[role] || role }
function greeting() { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening' }
function statusOptions(current, role) {
  const transitions = {
    REPORTED: ['UNDER_REVIEW', 'ASSIGNED', 'CANCELLED', 'REJECTED'],
    UNDER_REVIEW: ['ASSIGNED', 'CANCELLED', 'REJECTED'],
    ASSIGNED: ['RESCUE_IN_PROGRESS', 'AT_CLINIC', 'CANCELLED'],
    RESCUE_IN_PROGRESS: ['AT_CLINIC', 'CANCELLED'],
    AT_CLINIC: ['UNDER_TREATMENT', 'COMPLETED'], UNDER_TREATMENT: ['COMPLETED'],
  }
  if (role === 'CLINIC') return (transitions[current] || []).filter((status) => !['ASSIGNED', 'RESCUE_IN_PROGRESS', 'CANCELLED', 'REJECTED'].includes(status))
  return transitions[current] || []
}

export default App