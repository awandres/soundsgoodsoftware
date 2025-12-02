// @status: complete
// @exports: All shadcn/ui components and utilities
// UI Package - Shared components for SoundsGood Software

// Utilities
export { cn } from "./lib/utils";

// Hooks
export { useToast, toast } from "./hooks/use-toast";

// Components
export { Button, buttonVariants, type ButtonProps } from "./components/button";
export { Input, type InputProps } from "./components/input";
export { Label } from "./components/label";
export { Textarea } from "./components/textarea";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/card";
export { Spinner } from "./components/spinner";
export { Badge, badgeVariants, type BadgeProps } from "./components/badge";
export { Separator } from "./components/separator";
export { Checkbox } from "./components/checkbox";

// Dialog
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/dialog";

// Dropdown Menu
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./components/dropdown-menu";

// Select
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./components/select";

// Toast
export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from "./components/toast";
export { Toaster } from "./components/toaster";

// Avatar
export { Avatar, AvatarImage, AvatarFallback } from "./components/avatar";

// Scroll Area
export { ScrollArea, ScrollBar } from "./components/scroll-area";

// Switch
export { Switch } from "./components/switch";

// Tabs
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/tabs";

// Tooltip
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./components/tooltip";

// Popover
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "./components/popover";

// Alert Dialog
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./components/alert-dialog";

// Progress
export { Progress } from "./components/progress";

// Slider
export { Slider } from "./components/slider";
