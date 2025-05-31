import { Suspense, lazy, ReactNode, useEffect } from 'react';
import { Route, Switch, Router } from 'wouter';
import { AuthProvider } from '@/context/auth';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider } from '@/context/sidebar';
import { QueryProvider } from './lib/QueryProvider';
import ProtectedRoute from '@/components/templates/ProtectedRoute';
import PrivateLayout from '@/components/templates/PrivateLayout.tsx';
import LoadingFallback from '@/components/templates/LoadingFallback.tsx';
import { NotFound } from '@/components/templates/NotFound.tsx';
import { CollectionProvider } from '@/context/collection';
import { WishlistProvider } from '@/context/wishlist';
import { UserDataProvider } from '@/context/userData';
import { verifyAuthClaims } from '@/lib/firebase';
import { GalleryDemo } from './pages/GalleryDemo';
import { CardGridDemo } from './pages/CardGridDemo';

// Login y Register son críticos, por lo que los precargamos
import Login from '@/pages/Login';
// Lazy loading con nombres de chunks explícitos para mejor organización
const Register = lazy(() => import(/* webpackChunkName: "auth" */ '@/pages/Register'));

// Lazy loading agrupado por categorías funcionales para un mejor code splitting
// Páginas del perfil de usuario
const Profile = lazy(() => import(/* webpackChunkName: "user" */ '@/pages/Profile'));
const Settings = lazy(() => import(/* webpackChunkName: "user" */ '@/pages/Settings'));

// Página de colección de cartas
const Collection = lazy(() => import(/* webpackChunkName: "collection" */ '@/pages/collections'));

// Página de mazos
const Decks = lazy(() => import(/* webpackChunkName: "decks" */ '@/pages/decks'));
const DeckEditor = lazy(() => import(/* webpackChunkName: "decks" */ '@/pages/decks/editor'));
const DeckDetail = lazy(() => import(/* webpackChunkName: "decks" */ '@/pages/decks/[id]'));
const DecksFeed = lazy(() => import(/* webpackChunkName: "decks" */ '@/pages/decks/feed'));

// Páginas de listas de deseos
const Wishlists = lazy(() => import(/* webpackChunkName: "wishlists" */ '@/pages/wishlist'));
const WishlistDetail = lazy(() => import(/* webpackChunkName: "wishlists" */ '@/pages/wishlist/[id]'));

// Páginas de administración
const CardsManager = lazy(() => import(/* webpackChunkName: "admin" */ '@/pages/cards/index'));

// Componente para envolver en CollectionProvider y WishlistProvider
const WithProviders = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  // Solo mostrar mensaje de log, evitar refrescar claims para evitar error de logout
  useEffect(() => {
    if (user) {
      console.log('Usuario autenticado en WithProviders:', user.name);
      console.log('Rol del usuario:', user.role);
      console.log('Claims en localStorage:', localStorage.getItem('auth_claims'));
    }
  }, [user]);

  return (
    <CollectionProvider>
      <WishlistProvider>
        {children}
      </WishlistProvider>
    </CollectionProvider>
  );
};

// Lazy loading para la página de selector de cartas
const CardSelectorPage = lazy(() => import(/* webpackChunkName: "cards" */ '@/pages/cards/selector'));

function App() {
  // Verificar claims de Firebase al cargar la app
  useEffect(() => {
    const checkClaims = async () => {
      try {
        console.log('Iniciando verificación de claims en App...');
        await verifyAuthClaims();
      } catch (error) {
        console.error('Error al verificar claims en App:', error);
      }
    };
    checkClaims();
  }, []);

  // Componente para rutas que requieren autenticación (todas excepto login y register)
  const AuthenticatedRoute = ({ children }: { children: ReactNode }) => (
    <ProtectedRoute>
      <PrivateLayout>
        <WithProviders>
          <Suspense fallback={<LoadingFallback />}>
            {children}
          </Suspense>
        </WithProviders>
      </PrivateLayout>
    </ProtectedRoute>
  );

  return (
    <Router>
      <QueryProvider>
        <AuthProvider>
          <UserDataProvider>
            <SidebarProvider>
              <Switch>
                {/* Rutas públicas - solo login y registro */}
                <Route path="/login">
                  <Login />
                </Route>

                <Route path="/register">
                  <Suspense fallback={<LoadingFallback />}>
                    <Register />
                  </Suspense>
                </Route>

                {/* Todas las demás rutas requieren autenticación */}
                <Route path="/admin/cards">
                  <AuthenticatedRoute>
                    <CardsManager />
                  </AuthenticatedRoute>
                </Route>

                <Route path="/cards">
                  <AuthenticatedRoute>
                    <CardsManager />
                  </AuthenticatedRoute>
                </Route>

                <Route path="/collection">
                  <AuthenticatedRoute>
                    <Collection />
                  </AuthenticatedRoute>
                </Route>

                {/* Rutas para mazos */}
                <Route path="/decks">
                  <AuthenticatedRoute>
                    <Decks />
                  </AuthenticatedRoute>
                </Route>

                <Route path="/decks/editor/:id">
                  {() => (
                    <AuthenticatedRoute>
                      <DeckEditor />
                    </AuthenticatedRoute>
                  )}
                </Route>

                <Route path="/decks/editor">
                  <AuthenticatedRoute>
                    <DeckEditor />
                  </AuthenticatedRoute>
                </Route>

                <Route path="/decks/feed">
                  <AuthenticatedRoute>
                    <DecksFeed />
                  </AuthenticatedRoute>
                </Route>

                <Route path="/decks/:id">
                  {() => (
                    <AuthenticatedRoute>
                      <DeckDetail />
                    </AuthenticatedRoute>
                  )}
                </Route>

                {/* Rutas para listas de deseos */}
                <Route path="/wishlists">
                  <AuthenticatedRoute>
                    <Wishlists />
                  </AuthenticatedRoute>
                </Route>

                <Route path="/wishlist/:id">
                  {() => (
                    <AuthenticatedRoute>
                      <WishlistDetail />
                    </AuthenticatedRoute>
                  )}
                </Route>

                <Route path="/profile">
                  <AuthenticatedRoute>
                    <Profile />
                  </AuthenticatedRoute>
                </Route>

                <Route path="/settings">
                  <AuthenticatedRoute>
                    <Settings />
                  </AuthenticatedRoute>
                </Route>

                {/* Ruta principal (ahora es Collection) */}
                <Route path="/">
                  <AuthenticatedRoute>
                    <Collection />
                  </AuthenticatedRoute>
                </Route>

                <Route path="/gallery-demo" component={GalleryDemo} />
                <Route path="/card-grid-demo" component={CardGridDemo} />

                {/* Ruta para selector de cartas */}
                <Route path="/cards/selector">
                  <AuthenticatedRoute>
                    <CardSelectorPage />
                  </AuthenticatedRoute>
                </Route>

                {/* Ruta para capturar todas las URLs no definidas (404) y mostrar página no encontrada */}
                <Route path="/:rest*">
                  <Suspense fallback={<LoadingFallback />}>
                    <NotFound />
                  </Suspense>
                </Route>
              </Switch>
            </SidebarProvider>
          </UserDataProvider>
        </AuthProvider>
      </QueryProvider>
    </Router>
  );
}

export default App;
