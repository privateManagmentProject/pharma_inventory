export interface LicenseFile {
  name: string;
  path: string;
  type: string;
}

export interface Account {
  name: string;
  number: string;
  isDefault: boolean;
}

export interface Supplier {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  tinNumber: string;
  licenses: LicenseFile[];
  accounts: Account[];
}
