import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PostPage from './pages/Post';
import Agents from './pages/Agents';
import Messages from './pages/Messages';
import Explore from './pages/Explore';
import Marketplace from './pages/Marketplace';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile/:handle" element={<Profile />} />
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/marketplace" element={<Marketplace />} />
      </Routes>
    </Router>
  );
}

export default App;
