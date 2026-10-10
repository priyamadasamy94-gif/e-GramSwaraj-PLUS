import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Navigation, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatINR } from '../utils/format';
import 'leaflet/dist/leaflet.css';

/* ── Custom red marker icon (inline SVG, no external images needed) ── */
const RED_MARKER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
  <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 2.457.71 4.75 1.938 6.688L12.5 41l10.563-21.813A12.42 12.42 0 0025 12.5C25 5.596 19.404 0 12.5 0z" fill="#DC2626" stroke="#991B1B" stroke-width="1"/>
  <circle cx="12.5" cy="12.5" r="5.5" fill="white"/>
</svg>`)}`;

const redIcon = new L.Icon({
  iconUrl: RED_MARKER_SVG,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

const ORANGE_MARKER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
  <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 2.457.71 4.75 1.938 6.688L12.5 41l10.563-21.813A12.42 12.42 0 0025 12.5C25 5.596 19.404 0 12.5 0z" fill="#D97706" stroke="#92400E" stroke-width="1"/>
  <circle cx="12.5" cy="12.5" r="5.5" fill="white"/>
</svg>`)}`;

const orangeIcon = new L.Icon({
  iconUrl: ORANGE_MARKER_SVG,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

/* ── Coordinate helpers ── */
function coordinatesOf(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

function assetCoordinates(asset) {
  return coordinatesOf(asset.latitude, asset.longitude);
}

/* ── Map viewport auto-fit ── */
function MapViewport({ points, villageCenter }) {
  const map = useMap();
  const pointsKey = JSON.stringify(points);

  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 16);
    else if (points.length > 1) map.fitBounds(points, { padding: [28, 28], maxZoom: 16 });
    else if (villageCenter) map.setView(villageCenter, 14);
    map.invalidateSize();
  }, [map, pointsKey, villageCenter]);

  return null;
}

function MapClickHandler({ onPoint }) {
  useMapEvents({ click: (event) => onPoint([event.latlng.lat, event.latlng.lng]) });
  return null;
}

function FocusPoint({ point }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.setView(point, Math.max(map.getZoom(), 16));
  }, [map, point]);
  return null;
}

/* ── Google Maps link builders ── */
function googleMapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function googleMapsDirectionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/* ── Popup content with actions ── */
function PopupActions({ asset, onViewDetails, t }) {
  const map = useMap();
  const coords = assetCoordinates(asset);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-secondary btn-sm flex-1 justify-center"
          onClick={() => { map.closePopup(); onViewDetails?.(asset); }}
        >
          {t('viewDetails')}
        </button>
        <button type="button" className="btn-danger btn-sm flex-1 justify-center" onClick={() => map.closePopup()}>
          {t('close')}
        </button>
      </div>
      {coords && (
        <div className="flex gap-2">
          <a
            href={googleMapsUrl(coords[0], coords[1])}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-sm flex-1 justify-center inline-flex items-center gap-1.5 text-center no-underline"
            style={{ textDecoration: 'none' }}
          >
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> {t('assetMap.openGoogleMaps', 'Open in Google Maps')}
          </a>
          <a
            href={googleMapsDirectionsUrl(coords[0], coords[1])}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-sm flex-1 justify-center inline-flex items-center gap-1.5 text-center no-underline"
            style={{ textDecoration: 'none' }}
          >
            <Navigation className="h-3.5 w-3.5 flex-shrink-0" /> {t('assetMap.getDirections', 'Get Directions')}
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Main AssetMap component (citizen + admin view) ── */
export default function AssetMap({ assets = [], village, canSetLocation = false, onSetLocation, onViewDetails }) {
  const { t } = useLanguage();
  const mappedAssets = assets.filter((asset) => assetCoordinates(asset));
  const unlocatedAssets = assets.filter((asset) => !assetCoordinates(asset));
  const points = mappedAssets.map(assetCoordinates);
  const villageCenter = coordinatesOf(village?.latitude, village?.longitude);
  const center = points[0] || villageCenter;

  if (!center) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <MapPin className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">{t('assetMap.noExactLocations', 'No asset locations have been added yet.')}</p>
        <p className="text-xs text-slate-400">{t('assetMap.noExactLocationsHint', 'Admin users can set exact GPS locations for each asset.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-md bg-slate-50 px-4 py-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
          {t('assetMap.mappedCount', '{count} assets with location').replace('{count}', mappedAssets.length)}
        </span>
        {unlocatedAssets.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-slate-300 bg-white" />
            {t('assetMap.unmappedCount', '{count} without location').replace('{count}', unlocatedAssets.length)}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="relative z-0 h-[360px] sm:h-[480px]">
          <MapContainer center={center} zoom={14} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewport points={points} villageCenter={villageCenter} />
            {mappedAssets.map((asset) => (
              <Marker
                key={asset._id}
                position={assetCoordinates(asset)}
                icon={redIcon}
              >
                <Popup minWidth={310} maxWidth={380} maxHeight={400} closeButton={false}>
                  <div className="w-[310px] max-w-full space-y-2 text-sm text-slate-700">
                    <h3 className="text-base font-semibold leading-tight text-slate-900">{asset.name}</h3>
                    <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-slate-200 pt-2">
                      <dt>{t('assetMap.assetId')}</dt><dd className="break-words font-semibold">{asset.assetCode || '—'}</dd>
                      <dt>{t('assetMap.planYear')}</dt><dd className="break-words font-semibold">{asset.planYear || '—'}</dd>
                      <dt>{t('assetMap.assetCost')}</dt><dd className="break-words font-semibold">{formatINR(asset.estimatedValue)}</dd>
                      <dt>{t('assetMap.assetExpenditure')}</dt><dd className="break-words font-semibold">{formatINR(asset.expenditure)}</dd>
                      <dt>{t('category')}</dt><dd className="break-words font-semibold">{asset.category || '—'}</dd>
                      <dt>{t('assetMap.subCategory')}</dt><dd className="break-words font-semibold">{asset.subCategory || '—'}</dd>
                      <dt>{t('status')}</dt><dd className="break-words font-semibold">{asset.status || '—'}</dd>
                    </dl>
                    <PopupActions asset={asset} onViewDetails={onViewDetails} t={t} />
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        {mappedAssets.length === 0 && (
          <p className="border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {t('assetMap.villageCentered')}
          </p>
        )}
      </div>

      {unlocatedAssets.length > 0 && (
        <section aria-labelledby="asset-locations-unavailable">
          <div className="mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500" aria-hidden />
            <h3 id="asset-locations-unavailable" className="text-sm font-semibold text-slate-800">
              {t('assetMap.locationsUnavailable')} ({unlocatedAssets.length})
            </h3>
          </div>
          <ul className="divide-y divide-slate-100 border-y border-slate-200">
            {unlocatedAssets.map((asset) => (
              <li key={asset._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{asset.name}</p>
                  <p className="text-xs text-slate-500">{t('assets.field.assetCode')}: {asset.assetCode || '—'}</p>
                  <p className="mt-0.5 text-xs text-amber-600">{t('assetMap.locationStatus', 'Location')}: {t('assetMap.locationNotAvailable', 'Not available')}</p>
                </div>
                {canSetLocation && (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => onSetLocation?.(asset)}>
                    <MapPin className="h-3.5 w-3.5" /> {t('assetMap.setLocation')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ── AssetLocationPicker (admin location setter) ── */
export function AssetLocationPicker({ village, point, onPointChange }) {
  const { t, language } = useLanguage();
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [focus, setFocus] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const villageCenter = coordinatesOf(village?.latitude, village?.longitude);
  const center = villageCenter || coordinatesOf(point?.[0], point?.[1]);

  const [locating, setLocating] = useState(false);

  const getRealtimeLocation = () => {
    if (!navigator.geolocation) {
      setSearchError(t('assetMap.geolocationUnsupported', 'Geolocation is not supported by your browser'));
      return;
    }
    setLocating(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        onPointChange?.(coords);
        setFocus(coords);
        setLocating(false);
      },
      () => {
        setSearchError(t('assetMap.geolocationFailed', 'Unable to retrieve your current GPS location'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const searchPlace = async (event) => {
    event.preventDefault();
    if (!searchText.trim()) return;
    setSearching(true);
    setSearchError('');
    setResults([]);
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '5');
      url.searchParams.set('q', searchText.trim());
      const response = await fetch(url, { headers: { 'Accept-Language': language } });
      if (!response.ok) throw new Error('Search request failed');
      const places = await response.json();
      setResults(Array.isArray(places) ? places : []);
      if (!places.length) setSearchError(t('assetMap.noSearchResults'));
    } catch {
      setSearchError(t('assetMap.searchFailed'));
    } finally {
      setSearching(false);
    }
  };

  const resultPoints = useMemo(() => results.map((result) => ({
    point: coordinatesOf(result.lat, result.lon),
    label: result.display_name,
  })).filter((result) => result.point), [results]);

  if (!center) return <p className="text-sm text-slate-600">{t('assetMap.noExactLocations')}</p>;

  return (
    <div className="space-y-3">
      <form className="flex flex-wrap gap-2" onSubmit={searchPlace}>
        <input
          className="input min-w-0 flex-1"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder={t('assetMap.searchPlace')}
          aria-label={t('assetMap.searchPlace')}
        />
        <button type="submit" className="btn-secondary" disabled={searching || !searchText.trim()}>
          <Search className="h-4 w-4" /> {t('search')}
        </button>
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-1 text-emerald-700 font-medium"
          onClick={getRealtimeLocation}
          disabled={locating}
        >
          <Navigation className="h-4 w-4 text-emerald-600" />
          {locating ? t('loading') : t('assetMap.useRealTimeLocation', 'Use Real-Time Location')}
        </button>
      </form>
      {searchError && <p className="text-sm text-amber-800" role="status">{searchError}</p>}
      {resultPoints.length > 0 && (
        <ul className="max-h-32 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200">
          {resultPoints.map(({ point: resultPoint, label }) => (
            <li key={`${resultPoint[0]}-${resultPoint[1]}`}>
              <button type="button" className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={() => setFocus(resultPoint)}>
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-slate-600">{t('assetMap.clickExactPoint')}</p>
      <div className="relative z-0 h-[360px] overflow-hidden rounded-md border border-slate-200 sm:h-[460px]">
        <MapContainer center={center} zoom={14} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPoint={onPointChange} />
          <FocusPoint point={focus} />
          {point && <Marker position={point} icon={orangeIcon} />}
        </MapContainer>
      </div>
      <p className="text-xs tabular-nums text-slate-600" aria-live="polite">
        {t('assetMap.selectedCoordinates')}: {point ? `${point[0].toFixed(6)}, ${point[1].toFixed(6)}` : '—'}
      </p>
    </div>
  );
}
