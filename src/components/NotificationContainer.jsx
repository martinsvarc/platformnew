import { useNotifications } from '../contexts/NotificationContext'
import PaymentNotification from './PaymentNotification'

function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end max-w-md pointer-events-none">
      <div className="pointer-events-auto space-y-3">
        {notifications.map(notification => (
          <PaymentNotification
            key={notification.id}
            notification={notification}
            onDismiss={removeNotification}
          />
        ))}
      </div>
    </div>
  )
}

export default NotificationContainer

