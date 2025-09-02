import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field, Form, Formik, type FormikHelpers } from "formik";
import * as Yup from "yup";
import { updateSupplier } from "./api/supplierAPI";
import type { Supplier } from "./constants/supplier";

const validationSchema = Yup.object({
  name: Yup.string().required("Supplier name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  address: Yup.string().required("Address is required"),
  tinNumber: Yup.string().required("TIN number is required"),
  licenses: Yup.array().of(Yup.string()),
  account: Yup.object({
    name: Yup.string().required("Account name is required"),
    number: Yup.string().required("Account number is required"),
  }),
});

interface UpdateSupplierProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier;
}

const UpdateSupplier: React.FC<UpdateSupplierProps> = ({
  open,
  onOpenChange,
  supplier,
}) => {
  const handleSubmit = async (
    values: Supplier,
    { setSubmitting }: FormikHelpers<Supplier>
  ) => {
    try {
      await updateSupplier(supplier.id, values);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating supplier:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>
        <Formik
          initialValues={{
            name: supplier.name,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            tinNumber: supplier.tinNumber,
            licenses: supplier.licenses,
            account: supplier.account,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, errors, touched, values, setFieldValue }) => (
            <Form className="space-y-4">
              <div>
                <Label htmlFor="name">Supplier Name</Label>
                <Field
                  as={Input}
                  id="name"
                  name="name"
                  placeholder="Enter supplier name"
                />
                {errors.name && touched.name && (
                  <div className="text-red-500 text-sm">{errors.name}</div>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Field
                  as={Input}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                />
                {errors.email && touched.email && (
                  <div className="text-red-500 text-sm">{errors.email}</div>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Field
                  as={Input}
                  id="phone"
                  name="phone"
                  placeholder="Enter phone number"
                />
                {errors.phone && touched.phone && (
                  <div className="text-red-500 text-sm">{errors.phone}</div>
                )}
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Field
                  as={Textarea}
                  id="address"
                  name="address"
                  placeholder="Enter full address"
                  rows={3}
                />
                {errors.address && touched.address && (
                  <div className="text-red-500 text-sm">{errors.address}</div>
                )}
              </div>

              <div>
                <Label htmlFor="tinNumber">TIN Number</Label>
                <Field
                  as={Input}
                  id="tinNumber"
                  name="tinNumber"
                  placeholder="Enter TIN number"
                />
                {errors.tinNumber && touched.tinNumber && (
                  <div className="text-red-500 text-sm">{errors.tinNumber}</div>
                )}
              </div>

              <div>
                <Label htmlFor="licenses">Licenses (one per line)</Label>
                <Textarea
                  id="licenses"
                  name="licenses"
                  placeholder="Enter licenses, one per line"
                  rows={3}
                  value={values.licenses.join("\n")}
                  onChange={(e) =>
                    setFieldValue(
                      "licenses",
                      e.target.value
                        .split("\n")
                        .filter((line) => line.trim() !== "")
                    )
                  }
                />
                {errors.licenses && touched.licenses && (
                  <div className="text-red-500 text-sm">
                    {String(errors.licenses)}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Field
                  as={Input}
                  id="accountName"
                  name="account.name"
                  placeholder="Enter account name"
                />
                {errors.account?.name && touched.account?.name && (
                  <div className="text-red-500 text-sm">
                    {errors.account.name}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Field
                  as={Input}
                  id="accountNumber"
                  name="account.number"
                  placeholder="Enter account number"
                />
                {errors.account?.number && touched.account?.number && (
                  <div className="text-red-500 text-sm">
                    {errors.account.number}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Supplier"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateSupplier;
