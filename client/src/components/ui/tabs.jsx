// client/src/components/ui/tabs.jsx
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // این قسمت کاملاً اصلاح شد برای تم تیره
      "inline-flex h-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800/90 p-2 border border-gray-300 dark:border-gray-700 shadow-lg backdrop-blur-sm",
      className
    )}
    {...props} />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // این قسمت هم کاملاً حرفه‌ای شد
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-8 py-4 text-base font-bold transition-all duration-300",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // حالت عادی
      "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
      // حالت فعال — قوی و واضح!
      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600",
      "data-[state=active]:text-white data-[state=active]:shadow-2xl data-[state=active]:scale-105",
      "data-[state=active]:ring-4 data-[state=active]:ring-blue-500/30",
      className
    )}
    {...props} />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      // محتوای تب — بدون پس‌زمینه سفید ناخواسته
      "mt-10 rounded-3xl bg-white dark:bg-gray-900/95 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden",
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      "backdrop-blur supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-gray-900/90",
      className
    )}
    {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }