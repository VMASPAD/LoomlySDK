import Studio from "./components/Studio"
import RenderPage from "./RenderPage"
import { useState, useEffect } from "react"

function App() {
  // Estado compartido
  const [getData, setGetData] = useState<any>(null)
  const [styles, setStyles] = useState<string[]>([])
  const [currentRoute, setCurrentRoute] = useState<string>('')

  useEffect(() => {
    // Detectar ruta actual
    const path = window.location.pathname;
    setCurrentRoute(path);
    
    // Escuchar cambios de URL
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Routing simple
  if (currentRoute === '/render') {
    return <RenderPage />;
  }

  return (
    <main className='w-screen h-screen overflow-hidden'>
      <Studio getData={getData} setGetData={setGetData} styles={styles} setStyles={setStyles} />
    </main>
  )
}

export default App
