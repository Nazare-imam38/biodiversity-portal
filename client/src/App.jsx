import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Routes>
          {/* Login and Signup pages without Header/Footer */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Other pages with Header/Footer */}
          <Route path="/" element={
            <>
              <Header />
              <main className="flex-1">
                <Home />
              </main>
              <Footer />
            </>
          } />
          <Route path="/dashboard" element={
            <>
              <Header />
              <main className="flex-1">
                <Dashboard />
              </main>
              <Footer />
            </>
          } />
          <Route path="/home" element={
            <>
        <Header />
        <main className="flex-1">
                <Home />
        </main>
        <Footer />
            </>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App

