import { PropsWithChildren } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <div className="h-screen grid grid-rows-[auto,1fr]">
      <Navbar />
      <div className="grid grid-cols-[260px,1fr]">
        <Sidebar />
        <main className="p-6 overflow-auto bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
export default Layout
