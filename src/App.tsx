import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DerivativesPage from './pages/DerivativesPage';
import SignalsPage from './pages/SignalsPage';
import BoardPage from './pages/BoardPage';
import NewsPage from './pages/NewsPage';
import StockFilterPage from './pages/StockFilterPage';
import CallbacksPage from './pages/CallbacksPage';
import ChatPanelPage from './pages/ChatPanelPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/derivatives" element={<DerivativesPage />} />
          <Route path="/signals" element={<SignalsPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/stock-filter" element={<StockFilterPage />} />
          <Route path="/callbacks" element={<CallbacksPage />} />
          <Route path="/chatpanel" element={<ChatPanelPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
