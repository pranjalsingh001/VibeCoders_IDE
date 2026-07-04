import { PropsWithChildren } from 'react'

type Props = {
  isOpen: boolean
  onClose: () => void
  title?: string
}

const Modal = ({ isOpen, onClose, title, children }: PropsWithChildren<Props>) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 min-w-[320px] max-w-lg w-full" onClick={(e)=>e.stopPropagation()}>
        {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
        {children}
      </div>
    </div>
  )
}

export default Modal
