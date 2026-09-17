export interface BankInfo {
  name: string;
  code: string;
  country: string;
  tag: string;
  currency: string;
}

export const DEFAULT_BANK: BankInfo = {
  name: 'Opay',
  code: '100004',
  country: 'NG',
  tag: 'opay',
  currency: 'NGN',
};

export const POPULAR_NIGERIAN_BANKS: BankInfo[] = [
  DEFAULT_BANK,
  { name: 'Palmpay', code: '100033', country: 'Nigeria', tag: 'palmpay', currency: 'NGN' },
  { name: 'Moniepoint Microfinance Bank', code: '090405', country: 'Nigeria', tag: 'moniepoint', currency: 'NGN' },
  { name: 'Kuda', code: '090267', country: 'Nigeria', tag: 'kuda', currency: 'NGN' },
  { name: 'GTBANK PLC', code: '058', country: 'Nigeria', tag: 'gtb', currency: 'NGN' },
  { name: 'ZENITH BANK PLC', code: '057', country: 'Nigeria', tag: 'zenith', currency: 'NGN' },
  { name: 'ACCESS BANK NIGERIA', code: '044', country: 'Nigeria', tag: 'access', currency: 'NGN' },
  { name: 'UNITED BANK FOR AFRICA PLC', code: '033', country: 'Nigeria', tag: 'uba', currency: 'NGN' },
  { name: 'FIRST BANK PLC', code: '011', country: 'Nigeria', tag: 'firstbank', currency: 'NGN' },
  { name: 'FIRST CITY MONUMENT BANK PLC', code: '214', country: 'Nigeria', tag: 'fcmb', currency: 'NGN' },
  { name: 'STANBIC IBTC BANK PLC', code: '221', country: 'Nigeria', tag: 'stanbic', currency: 'NGN' },
  { name: 'STERLING BANK PLC', code: '232', country: 'Nigeria', tag: 'sterling', currency: 'NGN' },
  { name: 'WEMA BANK PLC', code: '035', country: 'Nigeria', tag: 'wema', currency: 'NGN' },
  { name: 'FIDELITY BANK PLC', code: '070', country: 'Nigeria', tag: 'fidelity', currency: 'NGN' },
  { name: 'UNION BANK OF NIGERIA PLC', code: '032', country: 'Nigeria', tag: 'unionbank', currency: 'NGN' },
  { name: 'KEYSTONE BANK PLC', code: '082', country: 'Nigeria', tag: 'keystone', currency: 'NGN' },
  { name: 'Polaris bank', code: '076', country: 'Nigeria', tag: 'polaris', currency: 'NGN' },
  { name: 'ProvidusBank PLC', code: '101', country: 'Nigeria', tag: 'providusbank', currency: 'NGN' },
  { name: 'Rubies Microfinance Bank', code: '090175', country: 'Nigeria', tag: 'rubiesbank', currency: 'NGN' },
  { name: 'VFD Micro Finance Bank', code: '090110', country: 'Nigeria', tag: 'vfd', currency: 'NGN' },
  { name: 'Carbon', code: '100026', country: 'Nigeria', tag: 'carbon', currency: 'NGN' },
  { name: 'Fairmoney Microfinance Bank Ltd', code: '090551', country: 'Nigeria', tag: 'fairmoney', currency: 'NGN' },
  { name: 'Paga', code: '327', country: 'Nigeria', tag: 'paga', currency: 'NGN' },
  { name: 'JAIZ BANK', code: '301', country: 'Nigeria', tag: 'jaiz', currency: 'NGN' },
  { name: 'TAJ BANK PLC', code: '000026', country: 'Nigeria', tag: 'taj', currency: 'NGN' },
  { name: 'PAYCOM', code: '305', country: 'Nigeria', tag: 'paycom', currency: 'NGN' }
];

export function findBankByTag(tagOrName: string): BankInfo {
  const normalized = tagOrName.trim().toLowerCase();
  const found = POPULAR_NIGERIAN_BANKS.find(
    (b) => b.tag.toLowerCase() === normalized || b.name.toLowerCase() === normalized || b.code === normalized
  );
  return found || DEFAULT_BANK;
}

export function searchBanks(query: string): BankInfo[] {
  if (!query || query.trim() === '') return POPULAR_NIGERIAN_BANKS;
  const q = query.toLowerCase().trim();
  return POPULAR_NIGERIAN_BANKS.filter(
    (b) =>
      b.name.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      b.tag.toLowerCase().includes(q)
  );
}
