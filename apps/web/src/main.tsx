import { createRoot } from 'react-dom/client'
import './style.css'

const App = () => <h1>Hello world</h1>

createRoot(document.getElementById('app')!).render(<App />)
