export function AuthDivider() {
  return (
    <div className="relative my-1">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <span className="w-full border-t border-[#1A1224]/10" />
      </div>
      <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A1224]/40">
        <span className="bg-[#FFFBFF] px-3">Or continue with</span>
      </div>
    </div>
  );
}
