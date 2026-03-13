import React, { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormConditions, Field } from '@/hooks/use-form-conditions';
import { buildDynamicZodSchema } from '@/lib/dynamic-schema';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface FormRendererProps {
  fields: Field[];
  onSubmit: (data: any) => void;
}

export function FormRenderer({ fields, onSubmit }: FormRendererProps) {
  // 1. Khởi tạo form với giá trị default
  const form = useForm({
    defaultValues: fields.reduce((acc, f) => ({ ...acc, [f.id]: f.type === 'multiselect' ? [] : "" }), {}),
  });

  // 2. Gắn Hook quản lý conditions tự động
  const { visibleFields, readonlyFields, requiredFields, dynamicOptions } = useFormConditions(fields, form);

  // 3. Build lại Schema Zod động mỗi khi required state hay visible state thay đổi
  const dynamicSchema = useMemo(() => {
    return buildDynamicZodSchema(fields, requiredFields, visibleFields);
  }, [fields, requiredFields, visibleFields]);

  // Cập nhật schema nóng cho form
  form.options.resolver = zodResolver(dynamicSchema);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field) => {
          // Ẩn field hoàn toàn nếu visible = false
          if (!visibleFields[field.id]) return null;

          // Lấy option động nếu có (bị ghi đè bởi rule set_options), không thì dùng options config
          const renderOptions = dynamicOptions[field.id] || field.options || [];
          const isRequired = requiredFields[field.id];
          const isReadonly = readonlyFields[field.id];

          return (
            <FormField
              key={field.id}
              control={form.control}
              name={field.id}
              render={({ field: rhfField }) => (
                <FormItem>
                  <FormLabel>
                    {field.name} {isRequired && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <FormControl>
                    {/* Switch case render UI control tương ứng */}
                    {field.type === "select" ? (
                      <Select 
                        disabled={isReadonly} 
                        // Ép kiểu do Select của shadcnui yêu cầu chuỗi
                        onValueChange={(val) => rhfField.onChange(val)} 
                        value={String(rhfField.value || '')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Chọn ${field.name.toLowerCase()}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {(renderOptions as any).map((opt: any) => (
                            <SelectItem key={opt.value} value={String(opt.value)}>
                              {opt.text || opt.label || opt.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.type === "multiselect" ? (
                      <div className="space-y-2">
                        {(renderOptions as any).map((opt: any) => {
                          const currentVals = (rhfField.value || []) as string[];
                          return (
                            <label key={opt.value} className="flex items-center space-x-2">
                              <Checkbox
                                disabled={isReadonly}
                                checked={currentVals.includes(String(opt.value))}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    rhfField.onChange([...currentVals, String(opt.value)]);
                                  } else {
                                    rhfField.onChange(currentVals.filter((v) => v !== String(opt.value)));
                                  }
                                }}
                              />
                              <span className="text-sm font-medium leading-none">{opt.text || opt.label || opt.value}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : field.type === "textarea" ? (
                      <Textarea
                        {...rhfField}
                        disabled={isReadonly}
                        placeholder={`Nhập ${field.name.toLowerCase()}`}
                      />
                    ) : (
                      <Input
                        {...rhfField}
                        disabled={isReadonly}
                        type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
                        placeholder={`Nhập ${field.name.toLowerCase()}`}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}

        <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
          Gửi dữ liệu
        </button>
      </form>
    </Form>
  );
}
