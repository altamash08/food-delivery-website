import React, { useEffect, useState } from 'react'
import './Dashboard.css'
import { toast } from 'react-toastify'
import api from '../../api'
import { currency } from '../../assets/assets'

const money = (n) => currency + Number(n || 0).toLocaleString('en-IN')

const dayLabel = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })

const Dashboard = () => {

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/admin/stats')
      if (response.data.success) {
        setStats(response.data.data)
      } else if (response.data.message !== 'Not Authorized') {
        toast.error('Could not load stats')
      }
    } catch (error) {
      toast.error('Could not load stats')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  if (!stats) {
    return (
      <div className='dashboard add'>
        <h3>Dashboard</h3>
        <p className="dashboard-note">{loading ? 'Loading your numbers...' : 'No data to show.'}</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...stats.days.map((d) => d.revenue), 1)
  const maxQty = Math.max(...stats.topItems.map((t) => t.quantity), 1)
  const statusTotal = Object.values(stats.statusCounts).reduce((a, b) => a + b, 0) || 1

  const cards = [
    { label: "Today's Orders", value: stats.todayOrders, tone: 'orange' },
    { label: "Today's Revenue", value: money(stats.todayRevenue), tone: 'green' },
    { label: 'Total Orders', value: stats.totalOrders, tone: 'blue' },
    { label: 'Total Revenue', value: money(stats.totalRevenue), tone: 'purple' },
    { label: 'Customers', value: stats.users, tone: 'amber' },
    { label: 'Dishes on Menu', value: stats.foods, tone: 'rose' },
  ]

  return (
    <div className='dashboard add'>
      <div className="dashboard-head">
        <h3>Dashboard</h3>
        <button onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
      </div>

      <div className="stat-cards">
        {cards.map((c) => (
          <div key={c.label} className={`stat-card ${c.tone}`}>
            <span>{c.label}</span>
            <b>{c.value}</b>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="dash-panel">
          <h4>Last 7 days revenue</h4>
          <div className="bars">
            {stats.days.map((d) => (
              <div className="bar-col" key={d.date} title={`${d.date}: ${money(d.revenue)} (${d.orders} orders)`}>
                <span className="bar-value">{d.revenue > 0 ? money(d.revenue) : ''}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: Math.max((d.revenue / maxRevenue) * 100, d.revenue > 0 ? 6 : 0) + '%' }}></div>
                </div>
                <span className="bar-label">{dayLabel(d.date)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-panel">
          <h4>Order status</h4>
          {Object.entries(stats.statusCounts).map(([name, count]) => (
            <div className="status-row" key={name}>
              <div className="status-row-top"><span>{name}</span><b>{count}</b></div>
              <div className="status-track"><div className={`status-fill s-${name.replace(/\s/g, '')}`} style={{ width: (count / statusTotal) * 100 + '%' }}></div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-panel">
          <h4>Top selling items</h4>
          {stats.topItems.length === 0
            ? <p className="dashboard-note">No orders yet.</p>
            : stats.topItems.map((item, i) => (
              <div className="top-row" key={item.name}>
                <span className="top-rank">{i + 1}</span>
                <div className="top-main">
                  <div className="top-line"><span>{item.name}</span><b>{item.quantity} sold</b></div>
                  <div className="status-track"><div className="status-fill top" style={{ width: (item.quantity / maxQty) * 100 + '%' }}></div></div>
                </div>
              </div>
            ))}
        </div>

        <div className="dash-panel">
          <h4>Recent orders</h4>
          {stats.recentOrders.length === 0
            ? <p className="dashboard-note">No orders yet.</p>
            : stats.recentOrders.map((o) => (
              <div className="recent-row" key={o._id}>
                <div>
                  <b>{(o.address && o.address.firstName) || 'Customer'} {(o.address && o.address.lastName) || ''}</b>
                  <span>{o.items.length} item{o.items.length === 1 ? '' : 's'} · {new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="recent-right">
                  <b>{money(o.amount)}</b>
                  <em className={`pill s-${o.status.replace(/\s/g, '')}`}>{o.status}</em>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
