import { transportModes } from '@/lib/mock/transportModes';

const getModeIcon = (modeId: string): string => {
  const iconMap: Record<string, string> = {
    walking: '🚶',
    angkot: '🚐',
    bus: '🚌',
    krl: '🚆',
    ojek: '🏍️',
  };
  return iconMap[modeId] || '🚌';
};

export function SupportedModesSection() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-neutral-900 mb-4">
          Kami Mendukung Berbagai Moda Transportasi
        </h2>
        <p className="text-center text-neutral-600 mb-12 max-w-2xl mx-auto">
          Pilih moda transportasi yang sesuai dengan kebutuhan perjalanan Anda
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {transportModes.map((mode) => (
            <div
              key={mode.id}
              className="bg-neutral-50 rounded-lg p-6 text-center hover:shadow-md transition-shadow"
            >
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${mode.colorHex}20` }}
              >
                <span className="text-2xl">{getModeIcon(mode.id)}</span>
              </div>
              <h3 className="font-semibold text-neutral-800 mb-1">{mode.name}</h3>
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: mode.colorHex }}
              >
                Tersedia
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
