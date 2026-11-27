import React, { useEffect, useState } from 'react'
import './List.css'
import { url, currency } from '../../assets/assets'
import api from '../../api';
import { toast } from 'react-toastify';
import { CATEGORIES } from '../../categories';

const List = () => {

  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);   // jis item ko edit kar rahe hain
  const [editImage, setEditImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    try {
      const response = await api.get(`/api/food/list`)
      if (response.data.success) {
        setList(response.data.data);
      }
      else {
        toast.error("Error")
      }
    } catch (error) {
      toast.error("Could not load items")
    }
  }

  const removeFood = async (foodId, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const response = await api.post(`/api/food/remove`, {
      id: foodId
    })
    await fetchList();
    if (response.data.success) {
      toast.success(response.data.message);
    }
    else if (response.data.message !== 'Not Authorized') {
      toast.error("Error")
    }
  }

  // in stock / out of stock
  const toggleStock = async (item) => {
    const next = item.inStock === false; // abhi out of stock hai to ab in stock karo
    const response = await api.post(`/api/food/stock`, { id: item._id, inStock: next })
    if (response.data.success) {
      setList((prev) => prev.map((f) => f._id === item._id ? { ...f, inStock: next } : f))
      toast.success(response.data.message)
    } else if (response.data.message !== 'Not Authorized') {
      toast.error(response.data.message)
    }
  }

  const openEdit = (item) => {
    setEditing({
      id: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
    });
    setEditImage(null);
  }

  const onEditChange = (e) => {
    const { name, value } = e.target;
    setEditing((prev) => ({ ...prev, [name]: value }));
  }

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("id", editing.id);
      formData.append("name", editing.name);
      formData.append("description", editing.description);
      formData.append("price", Number(editing.price));
      formData.append("category", editing.category);
      if (editImage) formData.append("image", editImage);

      const response = await api.post(`/api/food/update`, formData);
      if (response.data.success) {
        toast.success(response.data.message);
        setEditing(null);
        await fetchList();
      } else if (response.data.message !== 'Not Authorized') {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Could not save changes");
    }
    setSaving(false);
  }

  useEffect(() => {
    fetchList();
  }, [])

  const q = search.trim().toLowerCase();
  const shown = list.filter((item) => !q || (item.name + " " + item.category).toLowerCase().includes(q));
  const outCount = list.filter((item) => item.inStock === false).length;

  return (
    <div className='list add flex-col'>
      <p>All Foods List</p>

      <div className="list-toolbar">
        <input type="text" placeholder="Search by name or category..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <span>{shown.length} items{outCount > 0 && <> · <b>{outCount} out of stock</b></>}</span>
      </div>

      <div className='list-table'>
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Stock</b>
          <b>Actions</b>
        </div>
        {shown.map((item) => {
          const inStock = item.inStock !== false;
          return (
            <div key={item._id} className={`list-table-format ${inStock ? "" : "out"}`}>
              <img src={`${url}/images/` + item.image} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>{currency}{item.price}</p>
              <label className="switch" title={inStock ? "In stock (tap to mark out of stock)" : "Out of stock (tap to mark in stock)"}>
                <input type="checkbox" checked={inStock} onChange={() => toggleStock(item)} />
                <span className="switch-slider"></span>
                <em>{inStock ? "In stock" : "Sold out"}</em>
              </label>
              <div className="list-actions">
                <button className="edit" onClick={() => openEdit(item)}>Edit</button>
                <button className="delete" onClick={() => removeFood(item._id, item.name)} aria-label="Delete">x</button>
              </div>
            </div>
          )
        })}
        {shown.length === 0 && <p className="list-empty">No items found.</p>}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={saveEdit}>
            <div className="modal-title">
              <h3>Edit item</h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close">×</button>
            </div>

            <div className="modal-image">
              <img src={editImage ? URL.createObjectURL(editImage) : `${url}/images/${editing.image}`} alt="" />
              <label>
                Change image
                <input type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) setEditImage(e.target.files[0]); e.target.value = '' }} />
              </label>
            </div>

            <label>Name
              <input name="name" value={editing.name} onChange={onEditChange} required />
            </label>
            <label>Description
              <textarea name="description" rows={4} value={editing.description} onChange={onEditChange} required />
            </label>
            <div className="modal-row">
              <label>Category
                <select name="category" value={editing.category} onChange={onEditChange}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label>Price
                <input type="number" name="price" min="0" value={editing.price} onChange={onEditChange} required />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default List
