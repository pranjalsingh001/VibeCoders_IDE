import { Link } from 'react-router-dom'
const NotFoundPage = () => {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">404</h1>
        <p className="text-gray-600 mb-4">This page does not exist.</p>
        <Link to="/dashboard" className="text-primary-600 underline">Go to Dashboard</Link>
      </div>
    </div>
  )
}
export default NotFoundPage
