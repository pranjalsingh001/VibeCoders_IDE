import { LogOut } from 'lucide-react'
import useAuthStore from '../../stores/authStore'

const Navbar = () => {
  const logout = useAuthStore((s)=>s.logout)

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4">
      <div className="font-semibold">VibeCoders IDE</div>
      <button className="text-sm inline-flex items-center gap-1" onClick={logout}>
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </header>
  )
}
export default Navbar
