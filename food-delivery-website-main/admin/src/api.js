import axios from 'axios'
import { url } from './assets/assets'

// Sabhi admin requests yahin se jati hain: admin token header mein apne aap lag jata hai
const api = axios.create({ baseURL: url })

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminToken')
    if (token) {
        config.headers.set('token', token)
    }
    return config
})

// token expire / galat ho to seedha login page par
api.interceptors.response.use((response) => {
    if (response.data && response.data.success === false && response.data.message === 'Not Authorized') {
        localStorage.removeItem('adminToken')
        window.dispatchEvent(new Event('admin-logout'))
    }
    return response
})

export default api
