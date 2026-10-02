import { useEffect, useState } from 'react'
import { Archive, ArrowDownRight, ArrowUpRight, Boxes, Check, CircleUserRound, ClipboardList, LayoutDashboard, LogOut, Mail, PackagePlus, Plus, RefreshCw, Search, ShieldCheck, Tag, Trash2, Truck, X } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Boxes },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'quotes', label: 'Quotation requests', icon: ClipboardList },
  { id: 'inquiries', label: 'Inquiries', icon: Mail },
]

async function api(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || 'The request could not be completed')
    error.status = response.status
    throw error
  }
  return data
}

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function Login({ onLogin }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return <main className="login-shell">
    <section className="login-art" aria-label="Vvivers export operations">
      <div className="login-brand"><span className="brand-mark">V</span><span>Vvivers<span className="brand-divider">/</span>Admin</span></div>
      <div className="login-art-copy">
        <p className="kicker">Trade operations</p>
        <h1>One clear view<br />of every <em>order.</em></h1>
        <p>Manage your FMCG catalog, buyer requests, and export pipeline from one workspace.</p>
      </div>
      <div className="login-art-footer"><span>Vvivers India Pvt Ltd</span><span>Patparganj · Delhi</span></div>
    </section>
    <section className="login-panel">
      <div className="login-panel-inner">
        <div className="login-icon"><ShieldCheck size={22} /></div>
        <p className="kicker">Admin access</p>
        <h2>Sign in to your portal</h2>
        <p className="login-hint">Use the admin user ID and password configured on the Express server.</p>
        <form onSubmit={async (event) => {
          event.preventDefault()
          setBusy(true)
          setError('')
          const form = new FormData(event.currentTarget)
          try {
            const result = await api('/admin/login', '', {
              method: 'POST',
              body: JSON.stringify({ userId: form.get('userId'), password: form.get('password') }),
            })
            onLogin(result.token, result.userId)
          } catch (loginError) {
            setError(loginError.message)
          } finally {
            setBusy(false)
          }
        }}>
          <label>User ID<input name="userId" autoComplete="username" required placeholder="Admin user ID" /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Password" /></label>
          {error && <p className="notice error-notice">{error}</p>}
          <button className="primary-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowUpRight size={16} /></button>
        </form>
        <p className="secure-note"><ShieldCheck size={14} /> Credentials are checked by the Express API and never stored in this app.</p>
      </div>
    </section>
  </main>
}

function Metric({ label, value, detail, icon: Icon, accent }) {
  return <article className={`metric metric-${accent}`}>
    <div className="metric-top"><span>{label}</span><Icon size={18} /></div>
    <strong>{value ?? 0}</strong>
    <small>{detail}</small>
  </article>
}

function StatusControl({ item, path, token, onChange, setError }) {
  const [busy, setBusy] = useState(false)
  const nextStatus = item.status === 'pending' ? 'fulfilled' : 'pending'
  async function update() {
    setBusy(true)
    setError('')
    try {
      await api(`${path}/${item.id}/status`, token, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) })
      onChange()
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }
  return <div className="status-cell">
    <span className={`status-badge status-${item.status}`}>{item.status}</span>
    <button className="status-action" onClick={update} disabled={busy} title={`Mark ${nextStatus}`}>
      {item.status === 'pending' ? <Check size={14} /> : <RefreshCw size={14} />}
      {busy ? 'Saving' : `Mark ${nextStatus}`}
    </button>
  </div>
}

function AdminApp() {
  const [session, setSession] = useState(() => ({ token: localStorage.getItem('vvivers_admin_token') || '', userId: localStorage.getItem('vvivers_admin_user') || '' }))
  const [activeTab, setActiveTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [quotes, setQuotes] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('vvivers_admin_token')))
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [refreshVersion, setRefreshVersion] = useState(0)

  function signIn(token, userId) {
    localStorage.setItem('vvivers_admin_token', token)
    localStorage.setItem('vvivers_admin_user', userId)
    setLoading(true)
    setError('')
    setRefreshVersion((version) => version + 1)
    setSession({ token, userId })
  }

  function signOut() {
    localStorage.removeItem('vvivers_admin_token')
    localStorage.removeItem('vvivers_admin_user')
    setSession({ token: '', userId: '' })
    setOverview(null)
    setLoading(false)
  }

  function refreshData() {
    setLoading(true)
    setError('')
    setRefreshVersion((version) => version + 1)
  }

  useEffect(() => {
    if (!session.token) return undefined
    let active = true
    Promise.all([
      api('/admin/overview', session.token),
      api('/products', session.token),
      api('/categories', session.token),
      api('/admin/quotes', session.token),
      api('/admin/inquiries', session.token),
    ]).then(([summary, productRows, categoryRows, quoteRows, inquiryRows]) => {
      if (!active) return
      setOverview(summary)
      setProducts(productRows)
      setCategories(categoryRows)
      setQuotes(quoteRows)
      setInquiries(inquiryRows)
    }).catch((loadError) => {
      if (!active) return
      if (loadError.status === 401 || loadError.status === 403) signOut()
      else setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [session.token, refreshVersion])

  if (!session.token) return <Login onLogin={signIn} />

  async function perform(path, options, successMessage) {
    setError('')
    try {
      await api(path, session.token, options)
      if (successMessage) setError(successMessage)
      refreshData()
      return true
    } catch (actionError) {
      if (actionError.status === 401 || actionError.status === 403) signOut()
      else setError(actionError.message)
      return false
    }
  }

  function renderOverview() {
    return <>
      <div className="metric-grid">
        <Metric label="Catalog products" value={overview?.products?.total} detail={`${overview?.products?.featured || 0} featured`} icon={Boxes} accent="gold" />
        <Metric label="Categories" value={overview?.categories?.total} detail="Organized product lines" icon={Tag} accent="green" />
        <Metric label="Quotation requests" value={overview?.quotes?.total} detail={`${overview?.quotes?.pending || 0} awaiting action`} icon={ClipboardList} accent="coral" />
        <Metric label="Buyer inquiries" value={overview?.inquiries?.total} detail={`${overview?.inquiries?.pending || 0} awaiting action`} icon={Mail} accent="blue" />
      </div>
      <div className="dashboard-lower">
        <section className="panel recent-panel">
          <div className="panel-heading"><div><p className="kicker">Latest activity</p><h3>Recent quotations</h3></div><button className="text-button" onClick={() => setActiveTab('quotes')}>View all <ArrowDownRight size={15} /></button></div>
          {quotes.slice(0, 5).length ? quotes.slice(0, 5).map((quote) => <div className="recent-row" key={quote.id}>
            <div className="avatar avatar-coral">{quote.name?.slice(0, 1).toUpperCase()}</div>
            <div className="recent-copy"><strong>{quote.name}</strong><span>{quote.product_name} · {formatDate(quote.created_at)}</span></div>
            <span className={`status-badge status-${quote.status}`}>{quote.status}</span>
          </div>) : <EmptyState text="No quotation requests received yet." />}
        </section>
        <section className="panel supply-panel">
          <div className="panel-heading"><div><p className="kicker">Quick actions</p><h3>Manage supply</h3></div><Truck size={18} /></div>
          <button className="quick-action" onClick={() => { setActiveTab('products'); setShowProductForm(true) }}><span className="quick-icon"><PackagePlus size={17} /></span><span><strong>Add product</strong><small>Expand your FMCG catalog</small></span><ArrowUpRight size={15} /></button>
          <button className="quick-action" onClick={() => setActiveTab('categories')}><span className="quick-icon quick-icon-gold"><Tag size={17} /></span><span><strong>Manage categories</strong><small>Keep the catalog organized</small></span><ArrowUpRight size={15} /></button>
          <button className="quick-action" onClick={() => setActiveTab('inquiries')}><span className="quick-icon quick-icon-blue"><Mail size={17} /></span><span><strong>Review inquiries</strong><small>{overview?.inquiries?.pending || 0} need a response</small></span><ArrowUpRight size={15} /></button>
        </section>
      </div>
    </>
  }

  function renderProducts() {
    const visibleProducts = products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase()))
    return <>
      <div className="toolbar">
        <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" /></label>
        <button className="primary-button compact" onClick={() => setShowProductForm(!showProductForm)}><Plus size={16} /> Add product</button>
      </div>
      {showProductForm && <form className="panel product-form" onSubmit={async (event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const ok = await perform('/admin/products', { method: 'POST', body: JSON.stringify({
          name: form.get('name'), category_id: form.get('category_id'), size: form.get('size'), price: form.get('price'),
          image: form.get('image'), description: form.get('description'), accent: form.get('accent'),
          tags: form.get('tags').split(',').map((tag) => tag.trim()).filter(Boolean), is_featured: form.get('is_featured') === 'on',
        }) })
        if (ok) { event.currentTarget.reset(); setShowProductForm(false) }
      }}>
        <div className="form-heading"><div><p className="kicker">Catalog entry</p><h3>Add a product</h3></div><button className="icon-button" type="button" onClick={() => setShowProductForm(false)} aria-label="Close form"><X size={18} /></button></div>
        <div className="form-grid">
          <label>Product name<input name="name" required /></label>
          <label>Category<select name="category_id" required defaultValue=""><option value="" disabled>Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label>Pack size<input name="size" required placeholder="e.g. 500 ml" /></label>
          <label>Price<input name="price" required type="number" min="0" step="0.01" /></label>
          <label className="wide-field">Image URL<input name="image" type="url" required placeholder="https://…" /></label>
          <label className="wide-field">Description<textarea name="description" required rows="3" /></label>
          <label>Accent<select name="accent" defaultValue="coral"><option value="coral">Coral</option><option value="rose">Rose</option><option value="peach">Peach</option></select></label>
          <label>Tags<input name="tags" placeholder="Bulk-ready, Export grade" /></label>
          <label className="check-field"><input name="is_featured" type="checkbox" /> Feature on homepage</label>
        </div>
        <button className="primary-button compact" type="submit"><Plus size={16} /> Save product</button>
      </form>}
      <div className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Listing</th><th /></tr></thead>
        <tbody>{visibleProducts.map((product) => <tr key={product.id}>
          <td><div className="product-row"><img src={product.image} alt="" /><span><strong>{product.name}</strong><small>{product.size}</small></span></div></td>
          <td>{product.category}</td><td>{Number(product.price).toFixed(2)}</td>
          <td><button className={`feature-toggle ${product.is_featured ? 'is-featured' : ''}`} onClick={() => perform(`/admin/products/${product.id}/featured`, { method: 'PATCH', body: JSON.stringify({ is_featured: !product.is_featured }) })}>{product.is_featured ? <Check size={14} /> : <Plus size={14} />}{product.is_featured ? 'Featured' : 'Normal'}</button></td>
          <td><button className="icon-danger" onClick={() => window.confirm(`Remove ${product.name}?`) && perform(`/admin/products/${product.id}`, { method: 'DELETE' })} aria-label={`Remove ${product.name}`}><Trash2 size={16} /></button></td>
        </tr>)}</tbody></table>
        {!visibleProducts.length && <EmptyState text="No products match your search." />}
      </div></div>
    </>
  }

  function renderCategories() {
    return <>
      <form className="panel category-form" onSubmit={async (event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        if (await perform('/admin/categories', { method: 'POST', body: JSON.stringify({ name: form.get('name') }) })) event.currentTarget.reset()
      }}>
        <div><p className="kicker">Organize the catalog</p><h3>Add a category</h3></div>
        <label><span>Category name</span><input name="name" required placeholder="e.g. Beverages" /></label>
        <button className="primary-button compact"><Plus size={16} /> Add category</button>
      </form>
      <div className="category-list">{categories.map((category) => <article className="panel category-item" key={category.id}>
        <div className="category-mark"><Tag size={18} /></div><div className="category-copy"><strong>{category.name}</strong><span>{category.product_count} products</span></div>
        <button className="icon-danger" onClick={() => window.confirm(`Delete ${category.name}? Categories with products cannot be removed.`) && perform(`/admin/categories/${category.id}`, { method: 'DELETE' })} aria-label={`Delete ${category.name}`}><Trash2 size={16} /></button>
      </article>)}</div>
    </>
  }

  function renderRequests(items, kind) {
    const path = kind === 'quotes' ? '/admin/quotes' : '/admin/inquiries'
    return <div className="request-list">{items.length ? items.map((item) => <article className="panel request-card" key={item.id}>
      <div className="request-head"><div className={`avatar ${kind === 'quotes' ? 'avatar-coral' : 'avatar-blue'}`}>{item.name?.slice(0, 1).toUpperCase()}</div><div className="request-person"><strong>{item.name}</strong><a href={`mailto:${item.email}`}>{item.email}</a></div><StatusControl item={item} path={path} token={session.token} onChange={refreshData} setError={setError} /></div>
      <div className="request-body">
        {kind === 'quotes' ? <><div><span className="detail-label">Product</span><strong>{item.product_name}</strong></div><div><span className="detail-label">Quantity / notes</span><p>{item.notes || 'No notes provided'}</p></div></> : <><div><span className="detail-label">Phone</span><p>{item.phone || 'Not provided'}</p></div><div><span className="detail-label">Message</span><p>{item.message}</p></div></>}
      </div>
      <div className="request-date">Received {formatDate(item.created_at)}</div>
    </article>) : <div className="panel empty-panel"><EmptyState text={kind === 'quotes' ? 'No quotation requests have arrived yet.' : 'No buyer inquiries have arrived yet.'} /></div>}</div>
  }

  const currentTitle = tabs.find((tab) => tab.id === activeTab)?.label || 'Overview'
  return <div className="admin-shell">
    <aside className="sidebar">
      <a href="#overview" className="sidebar-brand"><span className="brand-mark">V</span><span><strong>Vvivers</strong><small>Admin workspace</small></span></a>
      <div className="sidebar-label">Workspace</div>
      <nav>{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveTab(id); setError('') }}><Icon size={17} /><span>{label}</span>{id === 'quotes' && quotes.filter((quote) => quote.status === 'pending').length > 0 && <b>{quotes.filter((quote) => quote.status === 'pending').length}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="user-chip"><span className="user-avatar"><CircleUserRound size={17} /></span><span><strong>{session.userId}</strong><small>Administrator</small></span></div><button className="logout-button" onClick={signOut}><LogOut size={16} /> Sign out</button></div>
    </aside>
    <main className="workspace">
      <header className="topbar"><div className="mobile-brand"><span className="brand-mark">V</span> Vvivers Admin</div><div className="breadcrumb">Operations <span>/</span> {currentTitle}</div><div className="topbar-actions"><span className="connection-state"><i /> </span><button className="icon-button" onClick={refreshData} disabled={loading} aria-label="Refresh data"><RefreshCw size={17} className={loading ? 'spin' : ''} /></button><button className="mobile-logout" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button></div></header>
      <div className="page-content">
        <div className="page-heading"><div><p className="kicker">Vvivers India Pvt Ltd <span>·</span> Trade operations</p><h1>{activeTab === 'overview' ? 'Good day, ' : ''}{activeTab === 'overview' && <em>{session.userId}</em>}{activeTab !== 'overview' && currentTitle}</h1><p>{activeTab === 'overview' ? 'Here’s the latest picture of your catalog and buyer activity.' : `Manage ${currentTitle.toLowerCase()} for your export business.`}</p></div>{activeTab === 'overview' && <button className="secondary-button" onClick={refreshData} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh</button>}</div>
        {error && <div className={`notice ${error.includes('success') ? 'success-notice' : 'error-notice'}`}><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss"><X size={15} /></button></div>}
        {loading && !overview ? <div className="loading-state"><RefreshCw size={19} className="spin" /> Loading workspace…</div> : <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'categories' && renderCategories()}
          {activeTab === 'quotes' && renderRequests(quotes, 'quotes')}
          {activeTab === 'inquiries' && renderRequests(inquiries, 'inquiries')}
        </>}
        <footer className="workspace-footer"><span>Vvivers Admin</span><span>Secure operations console</span></footer>
      </div>
    </main>
  </div>
}

function EmptyState({ text }) {
  return <div className="empty-state"><Archive size={20} /><span>{text}</span></div>
}

export default AdminApp