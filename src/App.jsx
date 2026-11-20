import { lazy, Suspense, useEffect, useState } from 'react'
import { Loader } from 'lucide-react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Catalog from './pages/Catalog.jsx'
import PWABadge from './components/PWABadge.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import { useRoute, navigate, goBack } from './router'
import './App.css'

// Lazy loading: only the catalog ships in the first bundle. Every other page
// (and the heavy create/edit forms) is fetched the first time it is visited.
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage.jsx'))
const ArchivePage = lazy(() => import('./pages/ArchivePage.jsx'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const GunDetailPage = lazy(() => import('./pages/GunDetailPage.jsx'))

const PageLoader = () => (
  <div className="state-box">
    <Loader size={28} className="spin" />
    <p>Loading…</p>
  </div>
)

// Header highlights the section the current route belongs to.
const TAB_BY_SEGMENT = {
  '': 'Catalog',
  catalog: 'Catalog',
  favorites: 'Favorites',
  archive: 'Archive',
  profile: 'Profile',
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const route = useRoute()
  const [first = '', id, action] = route.segments

  // Scroll to top on every page change.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [route.path])

  const renderPage = () => {
    switch (first) {
      case '':
      case 'catalog':
        return <Catalog />
      case 'favorites':
        return (
          <FavoritesPage
            onSelectGun={(g) => navigate(`/gun/${g.id}`)}
            onNavigateCatalog={() => navigate('/')}
          />
        )
      case 'archive':
        return <ArchivePage />
      case 'profile':
        return id === 'edit' ? (
          <ProfileEditPage />
        ) : (
          <ProfilePage onReplaySplash={() => setShowSplash(true)} />
        )
      case 'create':
        return (
          <CreateGunPage
            onBack={() => goBack('/')}
            onSuccess={() => navigate('/')}
          />
        )
      case 'gun':
        if (action === 'edit') {
          return (
            <EditGunPage
              key={id}
              gunId={id}
              onBack={() => goBack(`/gun/${id}`)}
              onSuccess={() => navigate(`/gun/${id}`)}
            />
          )
        }
        return <GunDetailPage key={id} id={id} />
      default:
        return (
          <div className="state-box">
            <p>Page not found.</p>
            <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
              Back to catalog
            </button>
          </div>
        )
    }
  }

  return (
    <div className="shell">
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <Header
        tab={TAB_BY_SEGMENT[first] || ''}
        onTab={(t) => navigate(t === 'Catalog' ? '/' : `/${t.toLowerCase()}`)}
        onNavigateCreate={() => navigate('/create')}
      />

      <main className="main">
        <Suspense fallback={<PageLoader />}>{renderPage()}</Suspense>
      </main>

      <PWABadge />
      <Footer />
    </div>
  )
}

export default App
