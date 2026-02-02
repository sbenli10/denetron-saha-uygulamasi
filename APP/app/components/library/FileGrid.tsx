// APP/app/components/library/FileGrid.tsx
"use client";

type FileItem = {
  id: string;
  file_url: string;
  mime_type: string | null;
  name: string;
  tags?: string[];
};

export default function FileGrid({ files }: { files: FileItem[] }) {
  if (!files || files.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-20">
        Bu klasörde dosya yok
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {files.map(file => {
        const isImage = file.mime_type?.startsWith("image");

        return (
          <div
            key={file.id}
            className="group border rounded-xl p-3 bg-white hover:shadow-md transition"
          >
            {/* PREVIEW */}
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-36 rounded-lg overflow-hidden bg-gray-100"
            >
              {isImage ? (
                <img
                  src={file.file_url}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-4xl">
                  📄
                </div>
              )}
            </a>

            {/* NAME */}
            <div className="mt-2 text-xs text-gray-700 truncate">
              {file.name}
            </div>

            {/* ACTIONS */}
            <div className="mt-2 flex justify-between opacity-0 group-hover:opacity-100 transition">
              <a
                href={file.file_url}
                target="_blank"
                className="text-xs text-blue-600 hover:underline"
              >
                Aç
              </a>
              <a
                href={file.file_url}
                download
                className="text-xs text-gray-600 hover:underline"
              >
                İndir
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
