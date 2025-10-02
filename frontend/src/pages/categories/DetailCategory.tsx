import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define the type for the category prop
interface Category {
  categoryName: string;
  categoryDescription: string;
}

// Define the props for the DetailCategory component
interface DetailCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
}

const DetailCategory: React.FC<DetailCategoryProps> = ({
  open,
  onOpenChange,
  category,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Category Details
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            View category information
          </DialogDescription>
        </DialogHeader>
        <Card className="border-0">
          <CardContent className="space-y-6 pt-4">
            <div>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Category Name
                </CardTitle>
              </CardHeader>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {category.categoryName}
              </p>
            </div>
            <div>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Description
                </CardTitle>
              </CardHeader>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {category.categoryDescription}
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end pt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-6 py-2 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailCategory;
