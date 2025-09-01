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
import { updateCategory } from "./api/categoryAPI";
import type { Category } from "./constants/catgory";

const validationSchema = Yup.object({
  categoryName: Yup.string().required("Category name is required"),
  categoryDescription: Yup.string().required("Description is required"),
});
interface UpdateCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
}

const UpdateCategory: React.FC<UpdateCategoryProps> = ({
  open,
  onOpenChange,
  category,
}) => {
  const handleSubmit = async (
    values: Category,
    { setSubmitting }: FormikHelpers<Category>
  ) => {
    try {
      await updateCategory(category.id, values);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating category:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <Formik
          initialValues={{
            categoryName: category.categoryName,
            categoryDescription: category.categoryDescription,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Category Name</Label>
                <Field
                  as={Input}
                  id="categoryName"
                  name="categoryName"
                  placeholder="Enter category name"
                />
                {errors.categoryName && touched.categoryName && (
                  <div className="text-red-500 text-sm">
                    {errors.categoryName}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="categoryDescription">Description</Label>
                <Field
                  as={Textarea}
                  id="categoryDescription"
                  name="categoryDescription"
                  placeholder="Enter category description"
                  rows={3}
                />
                {errors.categoryDescription && touched.categoryDescription && (
                  <div className="text-red-500 text-sm">
                    {errors.categoryDescription}
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
                  {isSubmitting ? "Updating..." : "Update Category"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateCategory;
