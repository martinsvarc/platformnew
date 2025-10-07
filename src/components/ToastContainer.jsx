import { useToast } from '../contexts/ToastContext'
import Toast from './Toast'

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-col items-end max-w-md pointer-events-none">
      <div className="pointer-events-auto space-y-3">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </div>
  )
}

export default ToastContainer

