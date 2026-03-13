import { z } from "zod";
import { Field } from "@/hooks/use-form-conditions";

export function buildDynamicZodSchema(fields: Field[], requiredState: Record<string, boolean>, visibleState: Record<string, boolean>) {
  const schemaShape: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    // Nếu field bị ẩn, bỏ qua validate toàn bộ
    if (!visibleState[field.id]) {
      schemaShape[field.id] = z.any().optional();
      return;
    }

    const isRequired = requiredState[field.id];
    let baseFieldSchema: z.ZodTypeAny;

    // Xây dựng kiểu core theo Directus field type
    switch (field.type) {
      case 'email':
        baseFieldSchema = z.string().email("Email không hợp lệ");
        break;
      case 'number':
        baseFieldSchema = z.coerce.number();
        break;
      case 'multiselect':
        baseFieldSchema = z.array(z.any());
        break;
      default:
        baseFieldSchema = z.string();
    }

    // Mix với optional / required động
    if (isRequired) {
      if (field.type === "multiselect") {
        schemaShape[field.id] = (baseFieldSchema as z.ZodArray<any>).min(1, "Bắt buộc chọn ít nhất 1 mục");
      } else {
        schemaShape[field.id] = (baseFieldSchema as z.ZodString).min(1, "Trường này là bắt buộc");
      }
    } else {
      schemaShape[field.id] = baseFieldSchema.optional().or(z.literal(""));
    }
  });

  return z.object(schemaShape);
}
