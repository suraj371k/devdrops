import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { restoreAuth } from './store/slices/authSlice'
import { initializeTheme } from './store/slices/uiSlice'
import { useGetMeQuery } from './store/api'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import RecallMode from './pages/RecallMode'
import DropDetail from './pages/DropDetail'
import MyDrops from './pages/MyDrops'
import Explorer from './pages/Explorer'
import Collections from './pages/Collections'
import CollectionView from './pages/CollectionView'
import Profile from './pages/Profile'
import PublicExplore from './pages/PublicExplore'
import SharedCollection from './pages/SharedCollection'
import LoadingSpinner from './components/common/LoadingSpinner'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth)
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(restoreAuth())
  }, [dispatch])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Restoring session..." />
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth)
  return isAuthenticated ? <Navigate to="/" replace /> : children
}

function App() {
  const dispatch = useDispatch()
  const { data: user, isLoading } = useGetMeQuery(undefined, { 
    skip: !localStorage.getItem('devdrops_token') && !sessionStorage.getItem('devdrops_token'),
  })

  useEffect(() => {
    dispatch(initializeTheme())
  }, [dispatch])

  useEffect(() => {
    if (user) {
      dispatch(restoreAuth())
    }
  }, [user, dispatch])

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/explore" element={<PublicExplore />} />
      <Route path="/shared/:token" element={<SharedCollection />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/recall" element={<RecallMode />} />
        <Route path="/recall/:id" element={<RecallMode />} />
        <Route path="/drops/:id" element={<DropDetail />} />
        <Route path="/my-drops" element={<MyDrops />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/collections/:id" element={<CollectionView />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
