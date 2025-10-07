import { useState, useCallback } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const confirm = useCallback((message, title = 'Potvrdit akci') => {
    return new Promise((resolve) => {
      setConfig({
        title,
        message,
        onConfirm: () => {
          resolve(true)
          setIsOpen(false)
        },
      })
      setIsOpen(true)
    })
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  const ConfirmDialogComponent = useCallback(() => (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={config.onConfirm}
      title={config.title}
      message={config.message}
    />
  ), [isOpen, handleClose, config])

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}

