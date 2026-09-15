import { HiChevronDown, HiOutlineUser } from "react-icons/hi2";

type UserDropdownProps = {
  username?: string;
};

export function UserDropdown({ username = "Pengguna" }: UserDropdownProps) {
  return (
    <button
      type="button"
      className="flex shrink-0 items-center gap-4 rounded-lg px-2 py-2 text-base font-medium text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-600"
      aria-label={`Menu pengguna ${username}`}
    >
      <HiOutlineUser aria-hidden="true" className="h-6 w-6 stroke-[1.25]" />
      <span>{username}</span>
      <HiChevronDown aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
