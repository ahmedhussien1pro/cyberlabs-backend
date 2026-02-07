export interface LabDefinition {
  labId: string; // الـ UUID الخاص باللاب من قاعدة البيانات
  labSlug: string; // اسم اللاب التقني (مثلاً idor-lab1)

  // دالة لتهيئة بيانات اللاب للمستخدم
  init(userId: string): Promise<void>;

  // دالة لجلب الحالة الحالية (مثلاً رصيد البنك أو قائمة اليوزرز)
  getState(userId: string): Promise<any>;
}
