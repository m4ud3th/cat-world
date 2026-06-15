import { Globe } from './components/Globe';

export default function App() {
  return (
    <main className="app-shell">
      <div className="globe-frame">
        <Globe dataUrl="/data/countries-110m.geojson" />
      </div>
    </main>
  );
}