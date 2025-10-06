import { FormField } from '@/directus/types'
import { UseFormRegister } from 'react-hook-form'

interface VFormSchemaProps {
  schema: Array<FormField>
  register: UseFormRegister<any>
}

export default function VFormSchema(props: VFormSchemaProps) {
  const { schema, register } = props

  return (
    <div>
      {schema.map((item) => {
        const translation = item.translations?.[0]
        if (item.type === 'input')
          return (
            <input
              key={item.id}
              type="text"
              className="input input-bordered w-full"
              placeholder={translation?.help}
              {...register(item.name)}
            />
          )
        if (item.type === 'textarea')
          return (
            <textarea
              key={item.id}
              className="textarea textarea-bordered w-full"
              placeholder={translation?.help}
              {...register(item.name)}
            />
          )
        if (item.type === 'select')
          return (
            <select
              key={item.id}
              className="select select-bordered w-full"
              {...register(item.name)}
            >
              <option value="">Select an option</option>
              {item.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )
        // Add default return for any unhandled types
        return null
      })}
    </div>
  )
}
