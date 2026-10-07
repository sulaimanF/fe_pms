# Panduan Coding Agent — FE PMS

Panduan ini berlaku untuk seluruh repository. Ikuti scope dan instruksi pengguna pada task aktif; instruksi pengguna mengambil prioritas atas panduan ini. Jangan menganggap dokumentasi ini sebagai izin untuk memperbaiki semua masalah project sekaligus.

**Fakta implementasi / kondisi saat ini** menjelaskan kode dan konfigurasi yang terakhir ditinjau pada 2026-10-05. Fakta frontend tidak membuktikan kontrak atau enforcement backend. Baca ulang kode terkait sebelum bekerja karena implementasi dapat berubah.

**Aturan kerja untuk perubahan berikutnya** mencakup batasan pengguna dan rekomendasi dari pola project. Aturan ini mengarahkan pekerjaan agent dalam scope task; bukan pernyataan bahwa seluruh source sudah mematuhinya. DTO lengkap, validasi ID, perlindungan dirty form, feedback error, blocking submission, dan accessibility belum diterapkan secara seragam. Keberadaan masalah existing tidak mengotorisasi perbaikannya di luar task.

## 1. Project overview

- Repository `fe_pms` adalah frontend Premises Management System (PMS).
- Aplikasi menggunakan Next.js App Router, dengan sebagian besar halaman bisnis berupa Client Components.
- Browser berkomunikasi langsung dengan backend melalui Axios instance bersama.
- Fitur yang tersedia meliputi login/OTP, dashboard, Role Management, User Management, Outlet Management, dan Audit Trail.
- Tingkat kelengkapan fitur berbeda. Jangan menyamakan keberadaan UI dengan keberadaan workflow API yang lengkap.
- Saat panduan disusun, penyimpanan create/update role dan user belum terhubung; sebagian aksi outlet dan download audit juga belum berfungsi. Audit Trail masih memakai data statis.

## 2. Technology stack

Gunakan `package.json` dan `package-lock.json` sebagai sumber versi dependency. Stack utama yang ditemukan:

- Next.js 16.2.9; React dan React DOM 19.2.4.
- TypeScript 5 dengan `strict: true`.
- TanStack React Query 5 untuk server state; TanStack React Table 8 untuk tabel.
- Redux Toolkit, React Redux, dan Redux Persist untuk auth state.
- Axios untuk HTTP.
- React Hook Form, Zod, dan `@hookform/resolvers` untuk form login/OTP.
- Tailwind CSS 4, shadcn/ui style `radix-nova`, Radix UI, dan Lucide icons.
- Sonner untuk toast aktif; CVA, clsx, dan tailwind-merge sebagai utility UI.
- ESLint 9 dengan konfigurasi Next.js Core Web Vitals dan TypeScript.

Dependency seperti React Query Devtools, framer-motion, goey-toast, dan next-themes tercantum, tetapi tidak semuanya terintegrasi pada UI aktif. Verifikasi penggunaan sebelum menambah, mengganti, atau menghapus dependency.

## 3. Project architecture

Pola pembacaan data utama:

```text
Page / Component
  -> React Query hook (src/hooks)
  -> API service (src/services)
  -> Axios instance (src/lib/axios.ts)
  -> Backend
  -> Response envelope
  -> React Query cache
  -> UI
```

- React Query menyimpan data dan status request; state form/interaksi berada di component atau React Hook Form.
- Redux menyimpan auth, challenge OTP, user, roles, permissions, dan menu.
- `src/app/layout.tsx` memasang ReduxProvider, TooltipProvider, dan Sonner.
- `src/store/provider.tsx` menggabungkan Redux Provider, PersistGate, dan QueryClientProvider.
- `next.config.ts` saat ini berisi konfigurasi kosong, tanpa custom rewrite/proxy. Base URL backend diatur dalam Axios, bukan konfigurasi Next.js. Jika task mengubah rewrite, proxy, atau rendering, periksa dampaknya terhadap alur browser -> backend dan authentication.
- Login/OTP dan dua implementasi logout masih memanggil API langsung dari component. Ini adalah kondisi existing, bukan alasan membuat client baru.
- Tidak ditemukan Pages Router, Route Handlers, Server Actions, `middleware.ts`, atau `proxy.ts` saat panduan disusun.
- Jangan mengubah architecture, strategi state, atau boundary client/server tanpa alasan jelas dan keterkaitan langsung dengan task. Jelaskan rencana sebelum perubahan besar.

## 4. Folder structure

```text
src/
  app/                 Routing, layout, halaman, CSS global
    (auth)/            Login dan OTP; route group tidak masuk URL
    dashboard/
    roleManagement/
    userManagement/
    outletManagement/  Tabel wilayah, KC, dan KCP
    auditTrail/
  components/
    auth/              Form login dan OTP
    dialogs/           Dialog konfirmasi
    layout/            Sidebar, header, dan AppLayout
    role/              RoleForm dan PermissionRole
    skeletons/         Skeleton halaman/form
    tables/            DataTables dan subcomponent generik
    ui/                Primitive UI lokal dan wrapper UI
  hooks/               Query, mutation, table state, deteksi mobile
  lib/                 Axios, QueryClient, utility cn()
  services/            HTTP request per domain
  store/               Store, provider, typed hooks, auth slice
  types/               Model dan response API
  validations/         Schema login dan OTP
public/                Asset statis
```

Halaman management juga menempatkan `columns.tsx`, modal, dan data contoh dekat fitur. Folder outlet `wilayah`, `kc`, dan `kcp` adalah component tabel, bukan route halaman tersendiri.

Route existing: `/`, `/login`, `/otp`, `/dashboard`, `/roleManagement`, `/roleManagement/create`, `/roleManagement/update/[id]`, `/userManagement`, `/userManagement/create`, `/userManagement/update/[id]`, `/outletManagement`, `/outletManagement/create`, dan `/auditTrail`.

## 5. Coding conventions

Aturan perubahan berikut mengikuti pola yang ditemukan; pemisahan tanggung jawab dan formatting source belum sepenuhnya seragam.

- Gunakan pola lokal file yang disentuh; source memakai function components, React hooks, dan named exports pada hooks/services.
- Gunakan alias `@/` untuk import lintas folder `src`; relative import tetap digunakan untuk file satu fitur.
- Pertahankan formatting sekitar perubahan. Jangan menjalankan formatting massal atau membersihkan seluruh repository untuk task kecil.
- Pisahkan tanggung jawab UI, query/mutation, request service, dan data types mengikuti pola existing.
- Periksa dependency antar file dan seluruh consumer sebelum mengubah component, hook, service, atau shared type.
- Jangan membuat duplicate component jika reusable component yang sesuai sudah tersedia.
- Jangan menghapus code yang belum terbukti unused. Periksa imports, exports, route convention, pemakaian dinamis, dan konteks fitur.

## 6. Naming conventions

- Untuk kode baru, gunakan PascalCase pada component, prefix `use` pada hook, dan camelCase pada function/state. Ini adalah aturan perubahan berikutnya; nama component existing belum seragam.
- Service existing memakai nama seperti `getRoles`, `getRoleById`, `deleteRole`, dan `updateUser`.
- Nama model/interface existing menggunakan PascalCase: `Role`, `Permission`, `UserManagement`, dan `ApiResponse<T>`.
- Field API umumnya snake_case; state UI umumnya camelCase. Jangan mengubah nama field wire-format tanpa kontrak atau mapping eksplisit.
- Folder route management existing menggunakan camelCase; jangan mengganti URL sebagai bagian dari perapian naming.
- Nama file belum seragam: ada `.service.ts`, `.services.ts`, PascalCase, lowercase, dan typo `ConfirmDiloagsLogout.tsx`. Ikuti konteks fitur; jangan melakukan rename massal tanpa scope yang sesuai.

## 7. TypeScript conventions

Kondisi saat ini: `tsconfig.json` memakai `strict`, `noEmit`, `incremental`, `isolatedModules`, `moduleResolution: "bundler"`, `allowJs`, dan `skipLibCheck`. Alias adalah `@/* -> ./src/*`. Strict/typecheck tidak memvalidasi response runtime, tidak membuktikan API contract, dan tidak otomatis menemukan seluruh unused code. Service `updateUser` masih memakai `payload: any`; import type juga belum seragam.

Aturan kerja untuk perubahan berikutnya:

- Pertahankan strict checking dan alias `@/* -> ./src/*` di `tsconfig.json`.
- Gunakan types existing di `src/types`; gunakan `import type` jika import hanya dipakai sebagai type.
- Verifikasi type terhadap caller aktif dan kontrak backend sebelum digunakan kembali. `ResendOtpRequest` di `src/types/auth.ts` mendefinisikan `{ reference }`, tetapi request resend aktif mengirim `{ login }`; `VerifyOtpRequest` juga tidak mencakup tambahan `login` pada verify setelah resend. Jangan memperlakukan DTO existing sebagai kontrak yang pasti benar.
- Definisikan request DTO dan response type untuk API yang ditambah atau diubah. Jangan menyalin `payload: any` dari service existing sebagai pola baru.
- Gunakan `unknown` untuk input/error yang belum diketahui dan lakukan narrowing.
- Interface/model API harus mengikuti nullability dan shape backend yang diverifikasi. Type assertion tidak memvalidasi response runtime.
- Validasi route ID sebelum request; konversi `Number(params.id)` saja belum menjamin ID valid.
- `types/api.ts` dan `types/common.ts` mendefinisikan envelope berbeda. Periksa import dan consumer sebelum memilih atau menyatukannya.
- Pertahankan generic typing pada DataTables dan hooks tabel; accessor harus sesuai data yang benar-benar dibaca, termasuk untuk search/filter.

## 8. Component conventions

- Tambahkan `"use client"` pada entry component yang perlu membentuk boundary client untuk hooks, event handlers, Redux/React Query, atau browser API. Periksa import graph: file yang sudah diimpor melalui boundary client tidak selalu memerlukan directive sendiri. `src/hooks/use-mobile.ts` memakai hooks/browser API tanpa directive dan digunakan oleh sidebar client.
- Props yang dikirim dari Server Component melewati boundary client harus dapat diserialisasi oleh React. Tempatkan akses browser API pada lifecycle/event client yang sesuai; directive client tidak membuat akses `window`/localStorage pada level module otomatis aman untuk prerender.
- Root layout dan wrapper login/OTP menunjukkan penggunaan Server Components; jangan mengubah seluruh subtree menjadi client tanpa kebutuhan.
- Gunakan props typed dan controlled state ketika parent memiliki data yang akan disimpan. `PermissionRole` menerima `selectedPermissions` dan `onChange` dari page.
- Jaga component reusable agar tidak terikat pada satu entity jika generic props sudah cukup.
- Sebelum memakai `RoleForm` atau `AppLayout`, periksa consumer aktif. Saat panduan disusun keduanya belum digunakan halaman aktif.
- Periksa layout route aktif di `src/app/*/layout.tsx` sebelum mengubah pembungkus halaman. Layout fitur, misalnya `src/app/roleManagement/layout.tsx`, memasang SidebarProvider, AppSidebar, dan AppHeader langsung; jangan memilih AppLayout hanya berdasarkan nama file. Periksa juga hubungan layout dengan provider root.
- Shared component dapat memengaruhi beberapa fitur; perubahan props/behavior harus memeriksa seluruh pemanggil.

## 9. Hook conventions

- Tempatkan query/mutation domain di `src/hooks` dan panggil service dari hook.
- Ikuti query key existing: `["roles"]`, `["role", id]`, `["users"]`, `["user", id]`, `["permissions"]`, `["menu-tree"]`, `["organization-units"]`, `["outlets"]`, `["outlets", organizationUnitId]`, dan `["me"]`. `useMe` mendefinisikan `["me"]`, tetapi belum dipakai UI aktif; keberadaan hook bukan bukti workflow sudah terhubung.
- `src/store/hooks.ts` menyediakan `useAppDispatch` dan `useAppSelector`. Gunakan helper typed tersebut untuk kode Redux baru; source existing masih mencampur helper typed dengan useDispatch/useSelector langsung. Tidak perlu migrasi massal untuk task kecil.
- Perubahan query key harus memperbarui seluruh invalidation dan consumer terkait.
- Gunakan dependency query yang valid. Hooks detail/outlet existing memakai `enabled`, tetapi pemeriksaan truthiness seperti `!!id` tidak menjamin ID valid. Validasi ID berdasarkan kontrak sebelum request; ini merupakan aturan perubahan berikutnya, bukan jaminan behavior seluruh hook existing.
- Mutation delete role memakai `useMutation` dan menginvalidasi `["roles"]`. Terapkan invalidation sesuai data yang benar-benar berubah pada mutation baru.
- QueryClient existing di `src/lib/queryClient.ts` memiliki retry satu kali, staleTime lima menit, dan refetchOnWindowFocus false. Jangan membuat QueryClient tambahan tanpa kebutuhan architecture yang jelas.
- Pertimbangkan dirty form sebelum reset akibat data query baru; jangan menimpa input pengguna secara diam-diam.
- `useDataTable` mengelola pagination/filter/sorting di client. Jangan menganggapnya sudah menggunakan pagination backend.

## 10. API/service conventions

- Gunakan Axios instance default dari `@/lib/axios`. Jangan membuat API client baru jika abstraction ini memenuhi kebutuhan.
- Service berada di `src/services`; tidak menangani JSX, navigasi, toast, atau state form.
- Pola existing mengembalikan `response.data`, yaitu envelope backend. Consumer biasanya membaca `query.data?.data`.
- Jangan mengubah return shape menjadi data entity saja tanpa memeriksa semua consumer.
- Axios instance menyiapkan base URL, `X-Code-Key`, JSON headers, dan request interceptor Authorization. Jangan menduplikasi logic token/header dalam service baru.
- Interceptor existing hanya membaca localStorage ketika `typeof window !== "undefined"` dan selalu membentuk `Authorization: Bearer <token>` dari key `token`; nilai `token_type` tidak dibaca interceptor. Jangan menyimpulkan header mengikuti token_type atau mengubah formatnya tanpa kontrak backend.
- Service yang dipanggil dari server tidak otomatis membawa token browser. Perubahan ke server fetching memerlukan desain authentication yang diverifikasi, bukan sekadar memindahkan pemanggilan service.
- Periksa request params, response envelope, pagination, dan HTTP method berdasarkan kontrak; jangan menyimpulkan hanya dari nama function.

Endpoint yang didefinisikan oleh request frontend saat panduan disusun. Tabel ini adalah inventaris frontend, bukan bukti kontrak backend sudah diverifikasi:

| Domain | Method dan path |
| --- | --- |
| Auth | POST `/auth/login`, `/auth/login/verify-otp`, `/auth/otp/verify`, `/auth/otp/resend`, `/auth/logout`; GET `/auth/me` |
| Role | GET `/roles`, GET `/roles/{id}`, DELETE `/roles/{id}` |
| User | GET `/users`, GET `/users/{id}`, PUT `/users/{id}` |
| Permission | GET `/permissions` |
| Menu | GET `/menus/tree` |
| Outlet | GET `/outlets`, filter `organization_unit_id` opsional |
| Organisasi | GET `/organizations` |

Endpoint create/update role belum didefinisikan di frontend. PUT user tersedia sebagai service tetapi belum dipanggil tombol Save. Jangan mengarang kontrak yang belum ada.

## 11. Authentication rules

Alur existing:

```text
Login -> POST /auth/login -> setOtpData -> /otp
OTP verify -> simpan token lokal -> GET /auth/me
           -> setAuthData -> /dashboard
```

- `authSlice` menyimpan reference, login, expiry, tujuan OTP, tipe verify, token, user, roles, permissions, menu, dan isAuthenticated.
- Token/token_type tersimpan pada key localStorage tersendiri dan auth state yang dipersist. Axios membaca key `token`; UI membaca Redux.
- Verify login memakai `{ reference, otp }`; verify setelah resend memakai `{ reference, otp, login }`. Resend saat ini mengirim `{ login }` dan mempertahankan reference lama.
- Jangan mengubah endpoint, reference lifecycle, payload, atau token format tanpa memverifikasi kontrak auth backend.
- Jika task menyentuh auth, periksa konsistensi token/storage/Redux, kegagalan `/auth/me`, logout gagal, refresh, dan pergantian akun.
- Saat panduan disusun, logout tidak membersihkan query cache dan reducer tidak mereset roles/menu/permissions. Jangan menganggap cleanup sesi sudah lengkap atau menyalin kelemahan tersebut ke workflow baru.
- Migrasi ke cookie/server session adalah perubahan architecture dan memerlukan scope serta koordinasi kontrak backend yang jelas.

## 12. Authorization/permission rules

- Bedakan permission pengguna login (`state.auth.permissions`, bertipe `string[]`) dari katalog permission (`Permission[]`, numeric IDs). Format dan makna string permission auth harus diverifikasi melalui kontrak backend; type string saja tidak membuktikan semantik code.
- Sidebar menggunakan `state.auth.menu` dari `/auth/me`; visibility menu bukan bukti authorization endpoint.
- Dashboard memiliki redirect berdasarkan `isAuthenticated`. Form OTP di `src/components/auth/verifyOtp.tsx` memiliki guard `!reference && !isAuthenticated` untuk mengarahkan ke login; tujuannya berbeda dari guard halaman bisnis. Halaman management belum memakai guard bersama dan permission belum membatasi aksi UI.
- Jangan mengklaim permission bypass backend hanya berdasarkan URL/tombol yang dapat diakses. Verifikasi response backend dengan konteks akun yang relevan.
- Untuk fitur yang memerlukan pembatasan akses, verifikasi permission code serta backend enforcement; jangan mengarang permission names atau memercayai state client sebagai kontrol keamanan utama.
- Jangan memperluas akses atau grant permission sebagai efek samping perubahan UI.

## 13. Form handling conventions

Mekanisme form di bawah adalah fakta implementasi. Aturan payload, pending/error/success, dirty state, dan draft Save/Cancel mengarahkan perubahan berikutnya dan belum dipenuhi oleh semua form existing.

- Login/OTP memakai React Hook Form dan Zod resolver; update user memakai React Hook Form, Controller, dan useWatch; role memakai local useState.
- Pertahankan form mechanism existing pada task kecil. Jangan memigrasi semua form tanpa alasan dan scope.
- Untuk form baru yang sejenis, gunakan abstraction form/validation yang sudah tersedia.
- Submission harus membentuk payload sesuai kontrak dan memiliki pending/error/success behavior yang jelas.
- Inisialisasi form detail dengan memperhatikan entity ID dan dirty state; refetch tidak boleh diam-diam membuang edit.
- Jika modal menawarkan Save/Cancel, perubahan draft tidak boleh dianggap committed sebelum Save. Modal outlet existing belum memisahkan draft dari parent state.
- Hubungan organisasi/outlet dan single-role/multi-role harus mengikuti aturan backend; jangan membuang assignment lama tanpa verifikasi.

## 14. Validation conventions

Schema login/OTP adalah implementasi existing. Validation bisnis pada fitur lain harus ditambahkan sesuai task dan requirement yang diverifikasi, bukan dianggap sudah tersedia.

- Schema existing berada di `src/validations`: `loginSchema.ts` dan `otpSchema.ts`.
- Types form login/OTP diturunkan dengan `z.infer`.
- Login saat ini mewajibkan login/password; OTP mewajibkan enam digit angka.
- Belum ada schema role/user/outlet yang lengkap. Tambahkan validation hanya untuk fitur yang sedang dikerjakan dan berdasarkan aturan bisnis yang diketahui.
- Tangani backend validation errors jika kontraknya tersedia; validation client tidak menggantikan validation backend.
- Jangan menambah batas panjang, aturan password, atau kewajiban permission yang tidak didukung requirement.

## 15. Error handling conventions

- Login/OTP memakai `axios.isAxiosError` dan Sonner toast; halaman list berbasis API seperti role/user/outlet memakai error state React Query. Audit Trail memakai data statis dan tidak memiliki query API tersebut.
- Pembedaan kategori error, fallback pesan, dan feedback mutation berikut adalah aturan untuk perubahan baru; belum diterapkan merata pada source existing.
- Untuk perubahan baru, bedakan network error, validation, unauthorized, forbidden, not-found, dan server error jika informasi tersedia.
- Gunakan fallback pesan saat body error tidak sesuai harapan. Jangan merender kegagalan API sebagai data kosong tanpa penjelasan.
- Mutation perlu feedback kegagalan; jangan menganggap onSuccess sudah mencakup error handling.
- Flag envelope `success` belum diperiksa secara konsisten. Verifikasi apakah backend memakai HTTP error atau HTTP 200 dengan kegagalan bisnis sebelum mengubah handling.
- Tidak ada response interceptor global auth/error saat ini. Penambahannya berdampak luas: periksa seluruh request dan jelaskan rencana jika diperlukan.
- Jangan mencetak Axios error mentah yang dapat membawa payload/password/token/header sensitif.

## 16. Loading state conventions

Component dan route loading yang disebutkan tersedia saat ini. Blocking submission, kesiapan lookup, dan feedback mutation merupakan target perilaku untuk perubahan berikutnya, bukan jaminan seluruh workflow existing.

- Reuse `components/skeletons/TableSkeleton.tsx`, `FormSkeleton.tsx`, `DataTablesLoading`, dan `ui/LoadingOverlay.tsx` sesuai konteks.
- `userManagement/loading.tsx` dan detail update user memiliki route loading wrapper; query client masih memerlukan loading handling di component.
- Bedakan initial loading dan mutation pending; blok aksi yang dapat menggandakan submission ketika pending.
- Katalog permission/lookup yang gagal atau belum siap tidak boleh dianggap pilihan kosong yang valid untuk submission.
- Dialog konfirmasi delete memakai Radix Action yang dapat menutup segera. Pilih lifecycle dialog dan feedback mutation secara eksplisit, bukan mengandalkan spinner dalam dialog yang sudah tertutup.

## 17. UI/component conventions

Library dan abstraction di bawah tersedia pada project. Aturan reuse, accessor, dan accessibility mengarahkan perubahan berikutnya; keberadaan primitive UI tidak membuktikan seluruh halaman sudah accessible atau seluruh filter bekerja benar.

- Reuse primitives lokal di `src/components/ui`; jangan menambah UI library lain untuk kebutuhan yang sudah terpenuhi.
- `components.json` menggunakan `radix-nova`, TSX, CSS variables, dan Lucide.
- Gunakan `cn()` dari `src/lib/utils.ts` dan CVA/variants jika sesuai component existing.
- CSS global berada di `src/app/globals.css` dan menggunakan Tailwind 4; jangan memperkenalkan konfigurasi Tailwind versi lain.
- Reuse DataTables beserta header, search, toolbar, pagination, column toggle, dan actions.
- Nilai accessor tabel harus mencerminkan data yang ditampilkan agar filtering bekerja; cell renderer saja tidak cukup.
- Gunakan labels/accessible names dan satu elemen interaktif yang tepat; `Button asChild` tersedia untuk Link.
- Sonner adalah toaster aktif. next-themes dipanggil wrapper Sonner, tetapi ThemeProvider aplikasi belum ditemukan; jangan menganggap dark-mode workflow sudah lengkap.

## 18. Role Management conventions

- Lokasi fitur: `src/app/roleManagement`; hooks: `src/hooks/useRoles.ts`; service: `src/services/role.services.ts`; types: `src/types/role.ts`.
- List memakai useRoles + useDataTable + DataTables. Delete memakai useDeleteRole dan konfirmasi.
- Create/update aktif memakai `PermissionRole`; page memiliki nama, deskripsi, dan selected permission IDs.
- `RoleForm.tsx` masih ada dengan implementasi serupa tetapi belum dipakai halaman aktif. Jangan membuat form ketiga atau menghapus RoleForm tanpa pemeriksaan consumer.
- Create/update handler saat ini hanya console; service penyimpanannya belum tersedia. Implementasi harus dimulai dari verifikasi kontrak, bukan tebakan method/payload.
- Detail menggunakan useRole(id); periksa validasi ID, error/not-found, loading, dan dirty-state initialization ketika mengubahnya.
- Jangan mengubah permission existing, termasuk assignment yang tidak terlihat di katalog aktif, tanpa aturan yang disepakati.

## 19. Permission Management conventions

- `types/permissions.ts` mendefinisikan id, code, module, resource, action, description, dan is_active.
- `usePermissions -> getPermissions -> GET /permissions` mengambil katalog.
- Selector aktif memfilter is_active, memakai daftar modul hardcoded, dan menampilkan viewAny/create/update/delete/export/review/approve/reject.
- Selector saat ini memakai satu `.find()` per action dan tidak membedakan resource. All Access memilih seluruh permission aktif pada modul, termasuk action yang mungkin tidak memiliki checkbox individual.
- Jika task mengubah assignment, verifikasi struktur katalog dan semantics module/resource/action sebelum mengubah mapping. Hindari grant yang tidak terlihat atau tidak dimaksudkan pengguna.
- CRUD Permission Management belum ditemukan; keberadaan tab Permission bukan bukti CRUD sudah tersedia.

## 20. Menu Management conventions

- `types/menu.ts` memiliki recursive children; `menu.services.ts` dan `useMenu.ts` mendefinisikan GET `/menus/tree`.
- useMenuTree belum terhubung ke UI aktif saat panduan disusun.
- Menu sidebar berasal dari `/auth/me` dengan bentuk AuthMenuGroup, berbeda dari MenuTree.
- Tab Menu pada PermissionRole merupakan modul permission `menu-management`, bukan pemilihan menu tree.
- Belum ditemukan halaman/mutation CRUD menu atau assignment menu role. Jangan menganggap endpoint atau hubungan role-menu tersedia tanpa verifikasi.
- AppSidebar memakai iconMap; icon yang tidak dikenal membuat item dilewati. Periksa kontrak menu/icon jika task menyentuh navigasi.

## 21. Rules untuk perubahan API

- Jangan mengubah API contract tanpa verifikasi melalui dokumentasi, kode backend yang tersedia, contoh response yang disanitasi, atau informasi pengguna.
- Endpoint yang belum diketahui adalah informasi yang perlu dikonfirmasi; jangan menebak method, path, payload, permission code, atau response shape.
- Telusuri service -> hook -> page/component -> type dan invalidation sebelum perubahan.
- Jangan mengganti return envelope atau menyatukan types secara diam-diam.
- Periksa pagination, filters, nullability, hubungan entity, dan semantics replace/patch pada mutation.
- Jangan menambahkan POST/PUT/DELETE request untuk pengujian ke backend nyata tanpa otorisasi yang sesuai dari task.
- Perubahan yang memengaruhi semua request harus dijelaskan terlebih dahulu dan tetap dalam scope.

## 22. Rules untuk environment variables

- Variable aplikasi yang ditemukan: `NEXT_PUBLIC_API_URL` dan `NEXT_PUBLIC_X_CODE_KEY`, digunakan `src/lib/axios.ts`.
- Dokumentasikan nama dan fungsi variable saja; jangan menampilkan nilainya.
- Jangan mengubah environment variable secret atau file environment tanpa instruksi pengguna yang secara eksplisit mencakup perubahan tersebut.
- `NEXT_PUBLIC_*` tersedia untuk browser dan nilainya di-inline saat build pada akses langsung seperti di `src/lib/axios.ts`. Mengubah environment deployment setelah build tidak otomatis mengubah bundle browser yang sudah dibuat; perubahan nilai tersebut memerlukan build/deployment baru. Jangan memakai prefix ini untuk secret baru.
- X-Code-Key existing dikirim browser; verifikasi apakah identifier publik atau credential sebelum mengambil keputusan security.
- `.env*` diabaikan Git. Jangan commit secret, membuat contoh berisi nilai asli, atau membaca/menyalin seluruh environment untuk debugging.

## 23. Security rules

- Jangan menampilkan secret, token, password, API key, Authorization header, atau request config sensitif yang nyata pada output, log, screenshot, test fixture, commit, maupun dokumentasi. Ini adalah batasan kerja; logging existing belum tentu mematuhinya.
- Gunakan fixture sintetis untuk pengujian, termasuk credential/token palsu yang tidak berasal dari akun atau backend nyata. Sanitasi informasi error/response; jangan menyalin data sensitif nyata menjadi fixture.
- Bedakan kelemahan yang terlihat di frontend, risiko bersyarat, dan exploit yang benar-benar terbukti.
- Token existing di localStorage/persisted Redux memiliki risiko akses script; jangan memperluas penyimpanan atau logging data sensitif.
- Saat mengubah sesi, periksa pembersihan seluruh auth state dan isolasi query cache antar akun. Menu tersembunyi dan flag isAuthenticated client bukan bukti keamanan backend.
- Jangan menonaktifkan validation, authorization, atau pengecekan types/lint untuk membuat task terlihat selesai.
- Jangan memperbaiki security concern dengan perubahan besar di luar scope; laporkan bukti dan rekomendasi yang relevan.

## 24. Testing expectations

- Setelah perubahan source, lakukan type checking, lint, dan test yang relevan dengan risiko perubahan.
- Gunakan tooling lokal tanpa mengunduh dependency hanya untuk menjalankan pemeriksaan:

```text
node ./node_modules/typescript/bin/tsc --noEmit --incremental false
node ./node_modules/eslint/bin/eslint.js src --no-cache
```

- Lint dapat ditargetkan ke file yang diubah; periksa consumer ketika perubahan menyentuh shared component/hook/type. Script lint repository adalah `npm run lint`.
- Scripts existing: dev, build, start, dan lint. Belum ditemukan test runner/script atau CI workflow saat panduan disusun.
- Jangan mengarang perintah test. Jangan memasang test framework baru tanpa kebutuhan dan scope yang jelas.
- Prioritaskan reproduksi/tes bermakna untuk auth transitions, cache antar akun, permission mapping, mutation errors, filter tabel, dan modal Save/Cancel ketika area itu berubah.
- Gunakan mocks/fixture untuk request yang menulis data. Browser/backend checks harus sesuai otorisasi task.
- Build dapat menghasilkan `.next` dan file terkait; lakukan hanya ketika relevan dan sesuai batasan perubahan pengguna.
- Untuk dokumentasi saja, review isi dan diff biasanya cukup; jangan menjalankan build/install yang tidak diperlukan.
- Hasil typecheck/lint/build/test bersifat sementara; catat tanggal, perintah, dan hasil pada laporan task, bukan sebagai status permanen repository. Jalankan ulang check yang diperlukan; bedakan failure existing dari regression. Jangan menyatakan pemeriksaan lulus jika tidak dijalankan atau masih gagal.

## 25. Git/change management rules

- Periksa `git status --short` sebelum bekerja. Repository dapat memiliki perubahan pengguna yang belum committed.
- Periksa apakah AGENTS.md di-track atau diabaikan Git sebelum menganggap panduan ikut dibagikan bersama repository. Pada review 2026-10-05, file belum tracked dan tidak diabaikan `.gitignore`. Status dapat berubah; jangan mengubah `.gitignore`, memaksa add, atau melakukan commit untuk membagikan panduan tanpa scope/otorisasi yang sesuai.
- Jangan menimpa, membatalkan, memindahkan, atau memasukkan perubahan unrelated milik pengguna ke task.
- Jangan melakukan perubahan di luar scope task, termasuk source, config, package.json, lockfile, environment, dan generated files yang tidak diperlukan.
- Jangan melakukan refactoring, dependency upgrade, formatting massal, rename route, atau penghapusan code sebagai tambahan spontan.
- Sebelum perubahan besar, jelaskan tujuan, file terkait, dampak API/state, dan rencana verifikasi. Penjelasan ini tidak otomatis mewajibkan konfirmasi tambahan untuk pekerjaan yang sudah diotorisasi.
- Periksa diff akhir dan pastikan hanya file yang diotorisasi berubah.
- Jangan melakukan commit, push, reset, merge, atau tindakan Git yang memublikasikan/membuang perubahan tanpa otorisasi yang sesuai.
- Laporan akhir harus menjelaskan perubahan, pemeriksaan yang dijalankan, hasilnya, dan keterbatasan material secara jujur tanpa membocorkan informasi sensitif.
