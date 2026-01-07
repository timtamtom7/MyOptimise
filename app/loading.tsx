export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent overflow-hidden pointer-events-none">
       <div className="h-full bg-primary animate-progress origin-left-right shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
       <style>{`
        @keyframes progress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 70%; margin-left: 0%; }
          100% { width: 100%; margin-left: 100%; }
        }
        .animate-progress {
          animation: progress 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
