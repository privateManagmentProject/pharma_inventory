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
import { updateCustomer } from "./api/customerAPI";
import type { Customer } from "./constants/customer";

const validationSchema = Yup.object({
  name: Yup.string().required("Customer name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  address: Yup.string().required("Address is required"),
  tinNumber: Yup.string().required("TIN number is required"),
  account: Yup.object({
    name: Yup.string().required("Account name is required"),
    number: Yup.string().required("Account number is required"),
  }).required("Account information is required"),
});

interface UpdateCustomerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

const UpdateCustomer: React.FC<UpdateCustomerProps> = ({
  open,
  onOpenChange,
  customer,
}) => {
  const handleSubmit = async (
    values: Customer,
    { setSubmitting }: FormikHelpers<Customer>
  ) => {
    try {
      await updateCustomer(customer.id, values);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating customer:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <Formik
          initialValues={{
            name: customer.name,
            email: customer.email,
            withhold: customer.withhold,
            companyName: customer.companyName,
            phone: customer.phone,
            address: customer.address,
            tinNumber: customer.tinNumber,
            licenses: customer.licenses,
            receiverInfo: customer.receiverInfo,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, errors, touched, values, setFieldValue }) => (
            <Form className="space-y-4">
              <div>
                <Label htmlFor="name">Customer Name</Label>
                <Field
                  as={Input}
                  id="name"
                  name="name"
                  placeholder="Enter customer name"
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
                <Label htmlFor="tinNumber">Company Name</Label>
                <Field
                  as={Input}
                  id="companyName"
                  name="companyName"
                  placeholder="Enter TIN number"
                />
                {errors.companyName && touched.companyName && (
                  <div className="text-red-500 text-sm">
                    {errors.companyName}
                  </div>
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
                <Label htmlFor="receiverName">Receiver Info</Label>
                <Field
                  as={Input}
                  id="receiverName"
                  name="receiverInfo.name"
                  placeholder="Enter account name"
                />
                {errors.receiverInfo?.name && touched.receiverInfo?.name && (
                  <div className="text-red-500 text-sm">
                    {errors.receiverInfo.name}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="receiverPhone">Receiver Number</Label>
                <Field
                  as={Input}
                  id="receiverPhone"
                  name="receiverInfo.phone"
                  placeholder="Enter account number"
                />
                {errors.receiverInfo?.phone && touched.receiverInfo?.phone && (
                  <div className="text-red-500 text-sm">
                    {errors.receiverInfo.phone}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="receiverAddress">Receiver Address</Label>
                <Field
                  as={Input}
                  id="receiverAddress"
                  name="receiverInfo.address"
                  placeholder="Enter receiverInfo address"
                />
                {errors.receiverInfo?.address &&
                  touched.receiverInfo?.address && (
                    <div className="text-red-500 text-sm">
                      {errors.receiverInfo.address}
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
                  {isSubmitting ? "Updating..." : "Update Customer"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateCustomer;
