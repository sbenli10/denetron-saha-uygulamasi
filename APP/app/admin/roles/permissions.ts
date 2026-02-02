export const PERMISSIONS = [
  {
    category: "Görev Yönetimi",
    items: [
      { key: "tasks.create", label: "Görev Oluşturma" },
      { key: "tasks.assign", label: "Görev Atama" },
      { key: "tasks.update", label: "Görev Düzenleme" },
      { key: "tasks.close", label: "Görev Tamamlama" },
    ],
  },
  {
    category: "Kullanıcı Yönetimi",
    items: [
      { key: "users.invite", label: "Kullanıcı Davet Etme" },
      { key: "users.update", label: "Kullanıcı Bilgisi Düzenleme" },
      { key: "users.remove", label: "Kullanıcı Silme" },
    ],
  },
  {
    category: "Şablon Yönetimi",
    items: [
      { key: "templates.create", label: "Şablon Oluşturma" },
      { key: "templates.edit", label: "Şablon Düzenleme" },
      { key: "templates.delete", label: "Şablon Silme" },
    ],
  },
];
