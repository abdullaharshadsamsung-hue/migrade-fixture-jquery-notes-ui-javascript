import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotesPage from './pages/NotesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NotesPage />} />
      </Routes>
    </BrowserRouter>
  );
}