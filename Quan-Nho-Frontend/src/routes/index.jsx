import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import ProtectedRoute from '../components/layout/ProtectedRoute'
import LoginPage from '../pages/Login'
import PosPage from '../pages/Pos'
import CustomerDisplayPage from '../pages/CustomerDisplay'
import MenuManagementPage from '../pages/MenuManagement'
import OptionGroupsPage from '../pages/OptionGroups'
import OrderHistoryPage from '../pages/OrderHistory'
import ReportsPage from '../pages/Reports'
import SettingsPage from '../pages/Settings'

// Helper component to redirect logged in users to pos screen
function HomeRedirect() {
  const { currentUser, loading } = useAuth()
  if (loading) return null
  if (!currentUser) return <Navigate to="/login" replace />
  return <Navigate to="/pos" replace />
}

export const router = createBrowserRouter([
  // Public route for Customer Facing Display (No auth needed!)
  {
    path: '/display',
    element: <CustomerDisplayPage />,
  },
  {
    path: '/customer-display',
    element: <Navigate to="/display" replace />,
  },

  // Public route for login
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Protected App layout routes (Chỉ dành cho Chủ quán)
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomeRedirect />,
      },
      {
        path: 'pos',
        element: (
          <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <PosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <OrderHistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'menu',
        element: (
          <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <MenuManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'options',
        element: (
          <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <OptionGroupsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      // Chuyển hướng các trang đã gỡ bỏ về pos
      {
        path: 'kitchen',
        element: <Navigate to="/pos" replace />,
      },
      {
        path: 'staff',
        element: <Navigate to="/pos" replace />,
      },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
