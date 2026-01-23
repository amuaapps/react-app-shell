import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import RemoteAppMount from '@/components/RemoteAppMount';
import { coreAppStub, campaignsAppStub } from '@/stubs';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Campaigns app owns /campaigns/* routes */}
        <Route
          path="campaigns/*"
          element={
            <RemoteAppMount
              remoteApp={campaignsAppStub}
              basePath="/campaigns"
              name="campaigns"
            />
          }
        />

        {/* Core app owns all other routes (/*) */}
        <Route
          path="*"
          element={
            <RemoteAppMount remoteApp={coreAppStub} basePath="/" name="core" />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
