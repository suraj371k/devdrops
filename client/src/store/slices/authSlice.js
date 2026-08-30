import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  rememberMe: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, rememberMe } = action.payload
      state.user = user
      state.token = token
      state.isAuthenticated = true
      state.isLoading = false
      state.rememberMe = rememberMe
      if (rememberMe) {
        localStorage.setItem('devdrops_token', token)
        localStorage.setItem('devdrops_user', JSON.stringify(user))
      } else {
        sessionStorage.setItem('devdrops_token', token)
        sessionStorage.setItem('devdrops_user', JSON.stringify(user))
      }
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.isLoading = false
      state.rememberMe = false
      localStorage.removeItem('devdrops_token')
      localStorage.removeItem('devdrops_user')
      sessionStorage.removeItem('devdrops_token')
      sessionStorage.removeItem('devdrops_user')
    },
    restoreAuth: (state) => {
      const token = localStorage.getItem('devdrops_token') || sessionStorage.getItem('devdrops_token')
      const user = localStorage.getItem('devdrops_user') || sessionStorage.getItem('devdrops_user')
      if (token && user) {
        state.token = token
        state.user = JSON.parse(user)
        state.isAuthenticated = true
        state.rememberMe = !!localStorage.getItem('devdrops_token')
      }
      state.isLoading = false
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      const storage = state.rememberMe ? localStorage : sessionStorage
      storage.setItem('devdrops_user', JSON.stringify(state.user))
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
  },
})

export const { setCredentials, logout, restoreAuth, updateUser, setLoading } = authSlice.actions
export default authSlice.reducer
