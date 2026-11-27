import React, { useEffect, useState } from 'react'
import './Promos.css'
import { toast } from 'react-toastify'
import api from '../../api'
import { currency } from '../../assets/assets'

const emptyForm = { code: '', type: 'percent', value: '', minOrder: '', maxDiscount: '', expiresAt: '' }

const Promos = () => {

  const [promos, setPromos] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const response = await api.get('/api/promo/list')
      if (response.data.success) {
        setPromos(response.data.data)
      }
    } catch (error) {
      toast.error('Could not load promo codes')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'code' ? value.toUpperCase().replace(/\s/g, '') : value }))
  }

  const create = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await api.post('/api/promo/add', form)
      if (response.data.success) {
        toast.success(response.data.message)
        setForm(emptyForm)
        await load()
      } else if (response.data.message !== 'Not Authorized') {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error('Could not create the code')
    }
    setSaving(false)
  }

  const toggle = async (id) => {
    const response = await api.post('/api/promo/toggle', { id })
    if (response.data.success) {
      await load()
    }
  }

  const remove = async (id, code) => {
    if (!window.confirm(`Delete promo code ${code}?`)) return
    const response = await api.post('/api/promo/remove', { id })
    if (response.data.success) {
      toast.success(response.data.message)
      await load()
    }
  }

  const describe = (p) => p.type === 'percent'
    ? `${p.value}% off${p.maxDiscount > 0 ? ` (max ${currency}${p.maxDiscount})` : ''}`
    : `${currency}${p.value} off`

  const isExpired = (p) => p.expiresAt && new Date(p.expiresAt) < new Date()

  return (
    <div className='promos add'>
      <h3>Promo Codes</h3>

      <form className='promo-form' onSubmit={create}>
        <h4>Create a new code</h4>
        <div className="promo-grid">
          <label>Code
            <input name="code" value={form.code} onChange={onChange} placeholder="e.g. QUICK20" maxLength={20} required />
          </label>
          <label>Type
            <select name="type" value={form.type} onChange={onChange}>
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat amount ({currency})</option>
            </select>
          </label>
          <label>{form.type === 'percent' ? 'Percent off' : `Amount off (${currency})`}
            <input type="number" name="value" min="1" max={form.type === 'percent' ? 100 : undefined} value={form.value} onChange={onChange} placeholder={form.type === 'percent' ? '20' : '50'} required />
          </label>
          <label>Minimum order ({currency})
            <input type="number" name="minOrder" min="0" value={form.minOrder} onChange={onChange} placeholder="0" />
          </label>
          {form.type === 'percent' && (
            <label>Max discount ({currency})
              <input type="number" name="maxDiscount" min="0" value={form.maxDiscount} onChange={onChange} placeholder="No limit" />
            </label>
          )}
          <label>Expires on (optional)
            <input type="date" name="expiresAt" value={form.expiresAt} onChange={onChange} />
          </label>
        </div>
        <button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create code'}</button>
      </form>

      <div className="promo-list">
        {promos.length === 0 && <p className="promo-empty">No promo codes yet. Create your first one above.</p>}
        {promos.map((p) => (
          <div key={p._id} className={`promo-item ${p.active && !isExpired(p) ? '' : 'off'}`}>
            <div className="promo-code">{p.code}</div>
            <div className="promo-info">
              <b>{describe(p)}</b>
              <span>
                {p.minOrder > 0 ? `Min order ${currency}${p.minOrder}` : 'No minimum'}
                {p.expiresAt && ` · ${isExpired(p) ? 'Expired' : 'Expires'} ${new Date(p.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </span>
            </div>
            <label className="switch" title="Turn on / off">
              <input type="checkbox" checked={p.active} onChange={() => toggle(p._id)} />
              <span className="switch-slider"></span>
              <em>{p.active ? 'Active' : 'Paused'}</em>
            </label>
            <button className="promo-delete" onClick={() => remove(p._id, p.code)} aria-label="Delete">x</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Promos
