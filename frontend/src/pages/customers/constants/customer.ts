export interface LicenseFile {
  name: string;
  path: string;
  type: string;
}

export interface Customer {
  id?: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  tinNumber: string;
  licenses: LicenseFile[];
  description: string;
  receiverInfo: {
    name: string;
    phone: string;
    address: string;
  };
  withhold: boolean;
}
