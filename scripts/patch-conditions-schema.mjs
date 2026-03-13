/**
 * Script: patch-conditions-schema.mjs
 * Mục đích: Cập nhật field `conditions` trong collection `form_fields` trên Directus
 *           từ Repeater có 1 JSON field thô (`item`) sang Repeater có các sub-fields chuẩn.
 *
 * Chạy: node scripts/patch-conditions-schema.mjs
 * Yêu cầu: DIRECTUS_URL và DIRECTUS_ADMIN_TOKEN trong môi trường hoặc ở dưới đây.
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'https://app.nexpo.vn';
const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || ''; // ← Điền token vào đây

if (!DIRECTUS_ADMIN_TOKEN) {
  console.error('❌ Thiếu DIRECTUS_ADMIN_TOKEN. Chạy: DIRECTUS_ADMIN_TOKEN=xxx node scripts/patch-conditions-schema.mjs');
  process.exit(1);
}

// Cấu hình mới cho Repeater `conditions`
// Mỗi condition row sẽ có các sub-fields rõ ràng thay vì 1 JSON field thô
const newFieldsMeta = {
  interface: 'list',
  special: ['cast-json'],
  options: {
    fields: [
      {
        field: 'source_field_id',
        name: 'Source Field ID',
        type: 'string',
        meta: {
          field: 'source_field_id',
          type: 'string',
          interface: 'input',
          note: 'ID (UUID) của field nguồn sẽ được watch',
          width: 'full',
          options: { placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        },
      },
      {
        field: 'operator',
        name: 'Operator',
        type: 'string',
        meta: {
          field: 'operator',
          type: 'string',
          interface: 'select-dropdown',
          width: 'half',
          options: {
            choices: [
              { text: 'Bằng (=)',       value: '_eq' },
              { text: 'Khác (≠)',       value: '_neq' },
              { text: 'Chứa',           value: '_contains' },
              { text: 'Lớn hơn (>)',    value: '_gt' },
              { text: 'Lớn hơn bằng (>=)', value: '_gte' },
              { text: 'Nhỏ hơn (<)',    value: '_lt' },
              { text: 'Nhỏ hơn bằng (<=)', value: '_lte' },
              { text: 'Nằm trong (in)', value: '_in' },
              { text: 'Ngoài (not in)', value: '_nin' },
            ],
          },
        },
      },
      {
        field: 'value',
        name: 'Value',
        type: 'string',
        meta: {
          field: 'value',
          type: 'string',
          interface: 'input',
          width: 'half',
          note: 'Với _in/_nin, nhập các giá trị phân cách bằng dấu phẩy: A,B,C',
          options: { placeholder: 'Giá trị so sánh' },
        },
      },
      {
        field: 'action',
        name: 'Action',
        type: 'string',
        meta: {
          field: 'action',
          type: 'string',
          interface: 'select-dropdown',
          width: 'half',
          options: {
            choices: [
              { text: 'Hiển thị field (show)',           value: 'show' },
              { text: 'Ẩn field (hide)',                 value: 'hide' },
              { text: 'Bắt buộc (required)',             value: 'required' },
              { text: 'Không bắt buộc (optional)',       value: 'optional' },
              { text: 'Chỉ đọc (readonly)',              value: 'readonly' },
              { text: 'Đổi options select (set_options)', value: 'set_options' },
              { text: 'Gán giá trị (set_value)',         value: 'set_value' },
            ],
          },
        },
      },
      {
        field: 'extra_value',
        name: 'Extra Value (set_value)',
        type: 'string',
        meta: {
          field: 'extra_value',
          type: 'string',
          interface: 'input',
          width: 'half',
          note: 'Chỉ dùng cho action set_value. Giá trị sẽ được gán vào field.',
          options: { placeholder: 'Giá trị muốn gán' },
        },
      },
      {
        field: 'extra_options',
        name: 'Extra Options (set_options)',
        type: 'json',
        meta: {
          field: 'extra_options',
          type: 'json',
          interface: 'input-code',
          width: 'full',
          note: 'Chỉ dùng cho action set_options. JSON array: [{"label":"Áo","value":"ao"},...]',
          options: { language: 'json' },
        },
      },
    ],
  },
};

async function patchConditionsField() {
  const url = `${DIRECTUS_URL}/fields/form_fields/conditions`;
  console.log(`\n📡 PATCH ${url}\n`);

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DIRECTUS_ADMIN_TOKEN}`,
    },
    body: JSON.stringify({ meta: newFieldsMeta }),
  });

  const body = await res.json();

  if (!res.ok) {
    console.error('❌ Lỗi:', res.status, JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log('✅ Patch thành công!');
  console.log('→ Field conditions bây giờ có', newFieldsMeta.options.fields.length, 'sub-fields:');
  newFieldsMeta.options.fields.forEach(f => console.log(`   • ${f.field} (${f.meta.interface})`));
  console.log('\nData structure mới mỗi condition row:');
  console.log(JSON.stringify({
    source_field_id: 'uuid-cua-field-nguon',
    operator: '_eq',
    value: 'gia_tri',
    action: 'show',
    extra_value: null,
    extra_options: null,
  }, null, 2));
}

patchConditionsField().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
