import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  theme: 'light',
  sidebarOpen: false,
  commandPaletteOpen: false,
  recallQueue: [],
  currentFilters: {
    type: '',
    visibility: '',
    tags: [],
    sort: 'newest',
  },
  viewMode: 'list',
  selectedDrops: [],
  modals: {
    createDrop: false,
    editDrop: null,
    createCollection: false,
    editCollection: null,
    shareCollection: null,
    confirmDelete: null,
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload
      localStorage.setItem('devdrops_theme', action.payload)
      document.documentElement.classList.toggle('dark', action.payload === 'dark')
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('devdrops_theme', state.theme)
      document.documentElement.classList.toggle('dark', state.theme === 'dark')
    },
    initializeTheme: (state) => {
      const saved = localStorage.getItem('devdrops_theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      state.theme = saved || (prefersDark ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', state.theme === 'dark')
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setCommandPaletteOpen: (state, action) => {
      state.commandPaletteOpen = action.payload
    },
    setRecallQueue: (state, action) => {
      state.recallQueue = action.payload
    },
    addToRecallQueue: (state, action) => {
      state.recallQueue = [...state.recallQueue, ...action.payload]
    },
    removeFromRecallQueue: (state, action) => {
      state.recallQueue = state.recallQueue.filter(d => d._id !== action.payload)
    },
    clearRecallQueue: (state) => {
      state.recallQueue = []
    },
    setFilters: (state, action) => {
      state.currentFilters = { ...state.currentFilters, ...action.payload }
    },
    clearFilters: (state) => {
      state.currentFilters = initialState.currentFilters
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload
    },
    toggleDropSelection: (state, action) => {
      const id = action.payload
      if (state.selectedDrops.includes(id)) {
        state.selectedDrops = state.selectedDrops.filter(d => d !== id)
      } else {
        state.selectedDrops.push(id)
      }
    },
    clearSelection: (state) => {
      state.selectedDrops = []
    },
    openModal: (state, action) => {
      const { modal, data } = action.payload
      state.modals[modal] = data || true
    },
    closeModal: (state, action) => {
      const modal = action.payload
      state.modals[modal] = initialState.modals[modal]
    },
    closeAllModals: (state) => {
      state.modals = initialState.modals
    },
  },
})

export const {
  setTheme,
  toggleTheme,
  initializeTheme,
  setSidebarOpen,
  toggleSidebar,
  setCommandPaletteOpen,
  setRecallQueue,
  addToRecallQueue,
  removeFromRecallQueue,
  clearRecallQueue,
  setFilters,
  clearFilters,
  setViewMode,
  toggleDropSelection,
  clearSelection,
  openModal,
  closeModal,
  closeAllModals,
} = uiSlice.actions
export default uiSlice.reducer