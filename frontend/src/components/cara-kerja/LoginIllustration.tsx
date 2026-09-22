import UserIcon from "@/components/icons/common/UserIcon";
import PadlockIcon from "@/components/icons/common/PadlockIcon";

export function LoginIllustration() {
  return (
    <div className="mx-auto w-full max-w-100 rounded-[20px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.10)] sm:p-9">
      <div className="space-y-5">
        <div className="flex h-16 items-center gap-5 rounded-[20px] border border-neutral-300 px-6">
          <UserIcon />
          <span className="h-6 w-full rounded-lg bg-[#EBF1FF]" />
        </div>
        <div className="flex h-16 items-center gap-5 rounded-[20px] border border-neutral-300 px-6">
          <PadlockIcon />
          <span className="h-6 w-full rounded-lg bg-[#EBF1FF]" />
        </div>
      </div>
      <button
        type="button"
        className="mt-7 h-16 w-full cursor-pointer rounded-[20px] bg-primary-600 text-xl font-semibold text-white transition hover:bg-primary-700"
      >
        Masuk
      </button>
    </div>
  );
}
