/**
 * F-014 關懷資源中心 — 澳門與香港
 * 依 GPS 回傳當地心理援助熱線（Phase 0 以靜態邊界判斷，後續可改為 GeoJSON）
 */

export interface CareResource {
  region: 'HK' | 'MO';
  name: string;
  phone: string;
  available: string;
  description?: string;
}

const HK_RESOURCES: CareResource[] = [
  { region: 'HK', name: '香港撒瑪利亞防止自殺會', phone: '23892222', available: '24小時', description: '24 小時' },
  { region: 'HK', name: '生命熱線', phone: '23820000', available: '24小時' },
  { region: 'HK', name: '向晴熱線', phone: '18288', available: '24小時' },
  { region: 'HK', name: '醫院管理局精神健康專線', phone: '24667350', available: '24小時' },
];

const MO_RESOURCES: CareResource[] = [
  { region: 'MO', name: '澳門明愛生命熱線', phone: '28525222', available: '24小時' },
  { region: 'MO', name: '社會工作局輔導熱線', phone: '28261126', available: '辦公時間' },
];

/** 簡化邊界：香港約 22.15–22.55 N, 113.8–114.4 E；澳門約 22.1–22.2 N, 113.5–113.6 E */
function getRegionFromLatLng(lat: number, lng: number): 'HK' | 'MO' {
  if (lat >= 22.1 && lat <= 22.25 && lng >= 113.5 && lng <= 113.65) return 'MO';
  if (lat >= 22.15 && lat <= 22.6 && lng >= 113.8 && lng <= 114.5) return 'HK';
  return 'HK'; // 預設香港
}

export function getCareResourcesByLocation(lat: number, lng: number): CareResource[] {
  const region = getRegionFromLatLng(lat, lng);
  return region === 'HK' ? [...HK_RESOURCES] : [...MO_RESOURCES];
}

export function getCareResourcesByRegion(region: 'HK' | 'MO'): CareResource[] {
  return region === 'HK' ? [...HK_RESOURCES] : [...MO_RESOURCES];
}
