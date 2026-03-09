"use client";

import * as React from "react";
import { cn } from "@/utils/cn";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

export function Select({ children, ...props }: SelectPrimitive.SelectProps) {
  return <SelectPrimitive.Root {...props}>{children}</SelectPrimitive.Root>;
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectPrimitive.SelectTriggerProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "input !text-xs mt-1 flex items-center justify-between aria-[invalid=true]:border-destructive disabled:bg-muted",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon>
      <ChevronDown size={14} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectContentProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position="popper"
      sideOffset={4}
      className={cn(
        "z-[150] w-[var(--radix-select-trigger-width)] border border-border bg-popover text-popover-foreground shadow-md rounded-xl overflow-hidden animate-in fade-in-80 zoom-in-95",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-3.5">
        <ChevronUp size={12} />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-3.5">
        <ChevronDown size={12} />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  SelectPrimitive.SelectItemProps
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-xs outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 inline-flex w-4">
      <SelectPrimitive.ItemIndicator>
        <Check size={12} />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

export const SelectValue = SelectPrimitive.Value;
