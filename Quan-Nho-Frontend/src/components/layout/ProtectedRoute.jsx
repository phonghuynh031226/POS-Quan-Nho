import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../common/Button'
import { ShieldAlert } from 'lucide-react'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, hasRole } = useAuth()
  const location = useLocation()

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-2xl shadow-lg border border-[#E8DFD5]">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#2D1B14] mb-2">Không đủ quyền truy cập</h3>
          <p className="text-sm text-stone-500 mb-6">
            Tài khoản của bạn ({currentUser.name} - vai trò {currentUser.role}) không có quyền truy
            cập màn hình này.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              window.location.href = '/pos'
            }}
          >
            Quay lại màn hình làm việc
          </Button>
        </div>
      </div>
    )
  }

  return children
}
