import Image from "next/image";

export function AuthSlideBudget() {
  return (
    <div className="grid h-full items-center gap-4 px-10 py-7 md:grid-cols-[1fr_1.15fr]">
      <div>
        <h3 className="text-xl leading-tight font-bold text-black">
          Hemat Ongkos, Tetap Otewe
        </h3>
        <p className="mt-3 max-w-xs text-base leading-relaxed text-neutral-800">
          Cari pilihan rute yang pas dengan budget perjalananmu.
        </p>
      </div>
      <div className="relative h-34">
        <Image
          src="/images/Login_Card1.png"
          alt="Ilustrasi rute perjalanan hemat"
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 40vw, 24vw"
        />
      </div>
    </div>
  );
}
