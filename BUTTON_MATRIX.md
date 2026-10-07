# Amalon CRM - Button Matrix & Interactive Elements Audit

This document records the verification of every clickable element, button, link, dropdown, filter, and action across the entire CRM application.

| # | Page / Location | Element Label / Icon | Type | Expected Result | Real Implementation Status |
|---|---|---|---|---|---|
| 1 | **Header** | Menu Toggle (Hamburger) | Button | Opens/closes mobile sidebar drawer | ✅ Works |
| 2 | **Header** | Branch Selector Dropdown | Dropdown | Switches active branch filter across all pages | ✅ Works |
| 3 | **Header** | Language Switcher (`EN` / `عربي`) | Button | Toggles RTL/LTR layout and Arabic/English language | ✅ Works |
| 4 | **Header** | Theme Switcher (Sun / Moon) | Button | Toggles between Dark Mode and Light Mode | ✅ Works |
| 5 | **Header** | Notifications Bell | Button / Modal | Displays unread notification count & alerts dropdown | ✅ Works |
| 6 | **Header** | "تحديد كمقروء" (Mark Read) | Button | Marks all notifications as read via `/api/notifications/read-all` | ✅ Works |
| 7 | **Sidebar** | Brand Logo / Title | Link | Navigates to Dashboard (`/`) | ✅ Works |
| 8 | **Sidebar** | لوحة التحكم | Link | Navigates to Dashboard (`/`) | ✅ Works |
| 9 | **Sidebar** | الطلاب | Link | Navigates to Students Directory (`/students`) | ✅ Works |
| 10 | **Sidebar** | القبولات والتقديمات | Link | Navigates to Applications List (`/applications`) | ✅ Works |
| 11 | **Sidebar** | لوحة كانبان | Link | Navigates to 14-Stage Kanban Board (`/kanban`) | ✅ Works |
| 12 | **Sidebar** | الدول والوجهات | Link | Navigates to 11 Countries Directory (`/countries`) | ✅ Works |
| 13 | **Sidebar** | الجامعات والشركاء | Link | Navigates to Universities Directory (`/universities`) | ✅ Works |
| 14 | **Sidebar** | إدارة المستندات | Link | Navigates to Document Vault (`/documents`) | ✅ Works |
| 15 | **Sidebar** | ملفات التأشيرات | Link | Navigates to Visa Cases & Embassy (`/visa`) | ✅ Works |
| 16 | **Sidebar** | المدفوعات والعقود | Link | Navigates to Finance & Payments (`/payments`) | ✅ Works |
| 17 | **Sidebar** | عمولات الجامعات | Link | Navigates to Commissions Tracker (`/commissions`) | ✅ Works |
| 18 | **Sidebar** | المهام والمتابعات | Link | Navigates to Operations Tasks (`/tasks`) | ✅ Works |
| 19 | **Sidebar** | التواصل والواتساب | Link | Navigates to WhatsApp Templates (`/communications`) | ✅ Works |
| 20 | **Sidebar** | التقارير والإحصائيات | Link | Navigates to Reports (`/reports`) | ✅ Works |
| 21 | **Sidebar** | الموظفون والفروع | Link | Navigates to Staff & Branches (`/employees`) | ✅ Works |
| 22 | **Sidebar** | سجل العمليات | Link | Navigates to Audit Logs (`/audit`) | ✅ Works |
| 23 | **Sidebar** | إعدادات النظام | Link | Navigates to Settings & Lookups (`/settings`) | ✅ Works |
| 24 | **Sidebar** | سلة المحذوفات | Link | Navigates to Trash & Restore (`/trash`) | ✅ Works |
| 25 | **Dashboard** | 12 KPI Metric Cards | Clickable Link | Filter/Navigate to respective module | ✅ Works |
| 26 | **Students** | "تصدير Excel" | Button | Generates and downloads real `.xlsx` file | ✅ Works |
| 27 | **Students** | "إضافة طالب" | Button / Modal | Opens modal form to register student | ✅ Works |
| 28 | **Students** | Search Input | Text Input | Live filter by name, code, phone, email | ✅ Works |
| 29 | **Students** | Status Filter Dropdown | Dropdown | Filters students by status in DB | ✅ Works |
| 30 | **Students** | Country Filter Dropdown | Dropdown | Filters students by target study country | ✅ Works |
| 31 | **Students** | WhatsApp Icon Button | Link | Opens `wa.me/<number>` directly | ✅ Works |
| 32 | **Students** | Student Detail Link | Link | Opens comprehensive dossier (`/students/[id]`) | ✅ Works |
| 33 | **Student Dossier**| 9 Navigation Tabs | Tab Switcher | Switches view (Overview, Timeline, Apps, Docs, Visa, Payments, Tasks, Comms, Travel) | ✅ Works |
| 34 | **Applications** | "لوحة كانبان" | Link | Navigates to `/kanban` | ✅ Works |
| 35 | **Applications** | Status Filter Dropdown | Dropdown | Filters applications list | ✅ Works |
| 36 | **Kanban** | "التالي" (Next Stage) | Action Button | Moves card forward in database and logs Timeline event | ✅ Works |
| 37 | **Kanban** | "السابق" (Previous Stage) | Action Button | Moves card backward in database and logs Timeline event | ✅ Works |
| 38 | **Countries** | Country Sidebar Cards | Selector Button | Displays specific country admission, language, visa requirements | ✅ Works |
| 39 | **Universities** | "واتساب الجامعة" | Link | Opens direct university contact on WhatsApp | ✅ Works |
| 40 | **Universities** | Website Globe Icon | External Link | Opens university official portal | ✅ Works |
| 41 | **Documents** | "معاينة" (Preview) | Link | Opens student document tab in student profile | ✅ Works |
| 42 | **Visa** | Case Detail Link | Link | Opens visa dossier tab in student profile | ✅ Works |
| 43 | **Payments** | Receipt Student Link | Link | Opens student payments record | ✅ Works |
| 44 | **Tasks** | Task Checkbox Toggle | Button | Updates task status (`completed`/`pending`) in DB instantly | ✅ Works |
| 45 | **Communications**| "نسخ النص" (Copy Template)| Button | Copies prefilled WhatsApp message to clipboard | ✅ Works |
| 46 | **Reports** | "تصدير التقرير الكامل" | Button | Generates real `.xlsx` export | ✅ Works |
| 47 | **Settings** | "إضافة خيار" | Button / Form | Creates new lookup option in database | ✅ Works |
| 48 | **Settings** | Delete Lookup Button | Button | Deletes lookup option and updates list | ✅ Works |
| 49 | **Settings** | "حفظ الحقل المخصص" | Button / Form | Saves custom field for Student/App/University | ✅ Works |
| 50 | **Trash** | "استعادة" (Restore) | Button | Restores soft-deleted entity and logs AuditLog | ✅ Works |
| 51 | **Trash** | "حذف نهائي" (Purge) | Button | Permanently purges record from SQLite DB | ✅ Works |
