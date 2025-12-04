interface DividerBlockProps {
  data: Record<string, unknown>;
}

export default function DividerBlock({ data }: DividerBlockProps) {
  const title = (data.title as string | undefined) || '';
  const style = (data.style as string | undefined) || 'solid';

  return (
    <section className="py-8 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        {title && (
          <p className="text-center text-sm font-medium text-neutral-500 mb-4">
            {title}
          </p>
        )}
        <hr
          className={`border-neutral-300 ${
            style === 'dashed'
              ? 'border-dashed'
              : style === 'dotted'
              ? 'border-dotted'
              : ''
          }`}
        />
      </div>
    </section>
  );
}




