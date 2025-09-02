export interface LicenseFile {
  name: string;
  path: string;
  type: string;
}

export interface Supplier {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  tinNumber: string;
  licenses: LicenseFile[]; // Changed from string[] to LicenseFile[]
  account: {
    name: string;
    number: string;
  };
}
